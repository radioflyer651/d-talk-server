import { BaseMessage, HumanMessage, mapChatMessagesToStoredMessages, mapStoredMessagesToChatMessages } from "@langchain/core/messages";
import { Agent } from "../agent.service";
import { ChatRoomData } from "./chat-room-data.model";
import { User } from "../../../model/shared-models/user.model";
import { Subject } from "rxjs";
import { IChatRoomEvent } from "../../../model/shared-models/chat-core/chat-room-event.model";
import { ChatRoomMessageEvent } from "../../../model/shared-models/chat-core/chat-room-events.model";
import { ChatDbService } from "../../../database/chat-db.service";
import { ChatRoomBusyStateEvent } from "../../../model/shared-models/chat-core/chat-room-busy-state.model";
import { IPluginResolver } from "../../agent-plugin/plugin-resolver.interface";
import { ChatJob } from "./chat-job.service";
import { AgentServiceFactory } from "../../agent-factory.service";
import { IJobHydratorService } from "./chat-job-hydrator.interface";
import { IChatLifetimeContributor } from "../../chat-lifetime-contributor.interface";
import { AgentPluginBase } from "../../agent-plugin/agent-plugin-base.service";
import { ChatCallState } from "./chat-room-graph/chat-room.state";
import { createChatRoomGraph } from "./chat-room-graph/chat-room.graph";
import { getIdForMessage } from "../../utilities/set-message-id.util";

export class ChatRoom implements IChatLifetimeContributor {
    constructor(
        readonly data: ChatRoomData,
        readonly agentFactory: AgentServiceFactory,
        readonly chatDbService: ChatDbService,
        readonly pluginResolver: IPluginResolver,
        readonly jobHydratorService: IJobHydratorService,
    ) {
        // Deserialize the message data.
        this.messages = mapStoredMessagesToChatMessages(this.data.conversation);
    }

    private _events = new Subject<IChatRoomEvent>();

    /** Events that occur during the chat. */
    readonly events = this._events.asObservable();

    get isBusy(): boolean {
        return this.data.isBusy;
    }

    private async setBusyState(newState: boolean): Promise<void> {
        // Set the local value.
        this.data.isBusy = newState;

        // Send the event.
        this._events.next(<ChatRoomBusyStateEvent>{
            eventType: "chat-room-busy-status-changed",
            newValue: newState
        });
    }

    async startupInitialization() {
        await this.hydrateAgents();
        await this.hydrateChatJobs();
    }

    private _agents: Agent[] = [];
    get agents(): Agent[] {
        return this._agents;
    }
    set agents(value: Agent[]) {
        this._agents = value;
    }

    private _plugins: AgentPluginBase[] = [];
    get plugins(): AgentPluginBase[] {
        return this._plugins;
    }
    set plugins(value: AgentPluginBase[]) {
        this._plugins = value;
    }

    private _chatJobs: ChatJob[] = [];
    get chatJobs(): ChatJob[] {
        return this._chatJobs;
    }
    set chatJobs(value: ChatJob[]) {
        this._chatJobs = value;
    }

    private _messages: BaseMessage[] = [];
    get messages(): BaseMessage[] {
        return this._messages;
    }
    set messages(value: BaseMessage[]) {
        this._messages = value;
    }

    private _externalLifetimeServices: IChatLifetimeContributor[] = [];
    /** External set of IChatLifetimeContributor services that will be connected to chat requests.
     *   This is for things like setting up socket messaging on chat events, and things like that. */
    get externalLifetimeServices(): IChatLifetimeContributor[] {
        return this._externalLifetimeServices;
    }
    set externalLifetimeServices(value: IChatLifetimeContributor[]) {
        this._externalLifetimeServices = value;
    }

    /** Loads the agent data, and creates new Agent objects for each. */
    private async hydrateAgents(): Promise<void> {
        // Get the agents from the database.
        const agentConfigs = await this.chatDbService.getAgentsByIds(this.data.agents);

        // Create the agents from these.
        const agentPromises = agentConfigs.map(c => this.agentFactory.getAgent(c));
        const agents = await Promise.all(agentPromises);

        // Set the chat room on these to this chat.
        agents.forEach(c => c.chatRoom = this);

        // Set the property with the agents.
        this.agents = agents;
    }

    /** Creates chat jobs from the data, and resolves their plugins. */
    private async hydrateChatJobs() {
        this.chatJobs = await this.jobHydratorService.hydrateJobs(this.data.jobs);
    }

    /** Called when a message is received from a user in this chat room. */
    async receiveUserMessage(message: string, user: User): Promise<void> {
        try {
            // Update our busy state.
            this.setBusyState(true);

            // Trigger the event so observers pick it up.
            this._events.next(<ChatRoomMessageEvent>{
                eventType: 'new-chat-message',
                chatRoomId: this.data._id!,
                agentId: user._id,
                agentType: 'user',
                dateTime: new Date(),
                message: message,
            });

            // Add this message to the conversation.
            this.messages.push(new HumanMessage(message, { id: getIdForMessage(), name: user.displayName ?? user.userName }));

            // Update the messages in the database.
            await this.saveConversation();

            // Execute the chat messages.
        } catch (err) {

        } finally {
            // Update our busy state.
            this.setBusyState(false);
        }
    }

    /** After a user message is received, this is the process for executing each chat job. */
    protected async executeTurnsForChatMessage(): Promise<void> {
        // Execute the jobs for this chat room.
        for (let j of this.chatJobs) {
            await this.executeTurnForJob(j);
        }

        // Save the chat history.
        await this.saveConversation();
    }

    protected async executeTurnForJob(job: ChatJob) {
        // Store the job data for the current chat that's executing.
        this._currentlyExecutingJob = job;
        try {
            // Get the agent for this job.
            const agent = this.agents.find(a => a.config._id.equals(job.data.agentId));

            // If there's no agent, then there's nothing we can do here.
            if (!agent) {
                return;
            }

            // Get the chat history.  We want a copy, so nothing's permanent until we want it to be.
            const history = this.messages.slice();

            // Collect the plugins.
            const plugins: AgentPluginBase[] = [
                ...agent.plugins,
                ...this.plugins,
                ...job.plugins,
            ];

            // Create the lifetime contributors for this chat interaction.
            const contributors: IChatLifetimeContributor[] = [
                agent,
                job,
                this,
                ...plugins,
                ...this.externalLifetimeServices
            ];

            // Create the graph state to call the chat.
            const graphState: typeof ChatCallState.State = {
                chatModel: agent.chatModel,
                lifetimeContributors: contributors,
                messageHistory: history,
            };

            // Create the graph instance.
            const graph = createChatRoomGraph();

            // Execute the chat call.
            const result = await graph.invoke(graphState);

            // Update the chat history.
            this.messages = result.messageHistory;
        } catch (err) {
            this.logError({
                message: `Error occurred while executing chat job: ${job.myName}`,
                error: err
            });
        }
        finally {
            // Reset the currently executing job.
            this._currentlyExecutingJob = undefined;
        }
    }

    /** Updates the data property on this chat room, synchronizing it with the chat room data. */
    public updateDataForStorage(): void {
        this.data.conversation = mapChatMessagesToStoredMessages(this.messages);
    }

    /** Saves the state of the chat room. */
    protected async saveConversation(): Promise<void> {
        this.updateDataForStorage();
        await this.chatDbService.updateChatRoomConversation(this.data._id, this.data.conversation);
    }

    async saveChatRoom(): Promise<void> {
        this.updateDataForStorage();
        await this.chatDbService.updateChatRoom(this.data._id, this.data);
    }

    /** Logs an error to the database, for this chat room. */
    protected async logError(error: object) {
        await this.chatDbService.addChatRoomLog(this.data._id, error);
    }

    /** The current chat job that's being processed, if any. */
    private _currentlyExecutingJob: ChatJob | undefined;

    async chatComplete(finalMessages: BaseMessage[], newMessages: BaseMessage[]): Promise<void> {
        // Get the final message.
        const finalMessage = newMessages[newMessages.length - 1];

        // Get the last message.
        this._events.next(<ChatRoomMessageEvent>{
            agentId: this._currentlyExecutingJob!.data.agentId,
            agentType: 'agent',
            chatRoomId: this.data._id,
            dateTime: new Date(),
            eventType: 'new-chat-message',
            message: finalMessage.text,
        });
    }
}
