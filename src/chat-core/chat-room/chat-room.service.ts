import { mapStoredMessagesToChatMessages, BaseMessage, HumanMessage, mapChatMessagesToStoredMessages, SystemMessage, AIMessage, AIMessageChunk } from "@langchain/core/messages";
import { Subject } from "rxjs";
import { AgentDbService } from "../../database/chat-core/agent-db.service";
import { ChatRoomDbService } from "../../database/chat-core/chat-room-db.service";
import { AgentInstanceConfiguration } from "../../model/shared-models/chat-core/agent-instance-configuration.model";
import { ChatRoomBusyStateEvent } from "../../model/shared-models/chat-core/chat-room-busy-state.model";
import { ChatRoomData } from "../../model/shared-models/chat-core/chat-room-data.model";
import { IChatRoomEvent } from "../../model/shared-models/chat-core/chat-room-event.model";
import { ChatRoomMessageEvent } from "../../model/shared-models/chat-core/chat-room-events.model";
import { User } from "../../model/shared-models/user.model";
import { getDistinctObjectIds } from "../../utils/get-distinct-object-ids.utils";
import { AgentServiceFactory } from "../agent-factory.service";
import { AgentPluginBase } from "../agent-plugin/agent-plugin-base.service";
import { IPluginResolver } from "../agent-plugin/plugin-resolver.interface";
import { ChatCallInfo, IChatLifetimeContributor } from "../chat-lifetime-contributor.interface";
import { createIdForMessage } from "../utilities/set-message-id.util";
import { setSpeakerOnMessage } from "../utilities/speaker.utils";
import { IJobHydratorService } from "./chat-job-hydrator.interface";
import { ChatJob } from "./chat-job.service";
import { createChatRoomGraph } from "./chat-room-graph/chat-room.graph";
import { ChatCallState, ChatState } from "./chat-room-graph/chat-room.state";
import { Agent } from "../agent/agent.service";
import { MessagePositionTypes, PositionableMessage } from "../../model/shared-models/chat-core/positionable-message.model";
import { StreamEvent } from "@langchain/core/tracers/log_stream";
import { ChatRoomSocketServer } from "../../server/socket-services/chat-room.socket-service";

/*  NOTE: This service might be a little heavy, and should probably be reduced in scope at some point. */

/** Provides basic interactive functionality for sending a message, from a user, to a chat room
 *   and getting an LLM response.  */
export class ChatRoom implements IChatLifetimeContributor {
    constructor(
        readonly data: ChatRoomData,
        readonly agentFactory: AgentServiceFactory,
        readonly chatRoomDbService: ChatRoomDbService,
        readonly pluginResolver: IPluginResolver,
        readonly jobHydratorService: IJobHydratorService,
        readonly agentDbService: AgentDbService,
        readonly chatRoomSocketServer: ChatRoomSocketServer,
    ) {
        this.messages = mapStoredMessagesToChatMessages(this.data.conversation ?? []);
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

    abortSignal?: AbortSignal;

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
        let existingAgents: AgentInstanceConfiguration[] = [];
        const existingAgentIds = this.data.agents.map(a => a.instanceId).filter(a => !!a);
        if (existingAgentIds.length > 0) {
            existingAgents = await this.agentDbService.getAgentsByIds(existingAgentIds);
        }

        // Get any agents that haven't been initialized yet.
        let newAgents: Agent[] = [];
        const newAgentConfigReferences = this.data.agents.filter(a => !a.instanceId);
        if (newAgentConfigReferences.length > 0) {
            // Get just the unique object IDs for the new agent configurations.
            const newAgentConfigIds = getDistinctObjectIds(newAgentConfigReferences.map(r => r.identityId));

            // Get the agent configurations.
            const newAgentConfigs = await this.agentDbService.getAgentIdentitiesByIds(newAgentConfigIds);

            // Create the enw agents.  We're doing it this long way in case an agent is listed twice.
            //  In that case, we'll have a single Agent Configuration for multiple references.
            const newAgentPromises = newAgentConfigReferences.map(async ref => {
                // Get the config for this.
                const config = newAgentConfigs.find(c => c._id.equals(ref.identityId));

                // This would be strange, but...
                if (!config) {
                    throw new Error(`No config found for ID: ${ref.identityId}`);
                }

                // Create a new agent for this configuration.
                const newAgent = await this.agentFactory.createAgent(config);

                // Now, update the reference, since it's still attached to the chat room data.  Thus, we update
                //  the chat room data.
                ref.instanceId = newAgent.data._id;

                // Return the agent, creating an array of agents.
                return newAgent;
            });

            // Wait for the new agents to be resolved.  This variable was previously
            //  created and will be added to the rest of the agents that already exist.
            newAgents = await Promise.all(newAgentPromises);

            // Update the chat room data, so we now have the instance references included.
            await this.chatRoomDbService.updateChatRoom(this.data._id, { agents: this.data.agents });
        }

        // Create the agents from these.
        const agentPromises = existingAgents.map(c => this.agentFactory.getAgent(c));
        const agents = await Promise.all(agentPromises);
        // Add the new agents.
        agents.push(...newAgents);

        // Set the chat room on these to this chat.
        agents.forEach(c => c.chatRoom = this);

        // Set the property with the agents.
        this.agents = agents;
    }

    /** Creates chat jobs from the data, and resolves their plugins. */
    private async hydrateChatJobs() {
        this.chatJobs = await this.jobHydratorService.hydrateJobs(this.data.jobs);

        // The chat job instances may have been altered, so we need to save the references, just to be sure.
        await this.chatRoomDbService.updateChatRoom(this.data._id, { jobs: this.data.jobs });
    }

    /** Called when a message is received from a user in this chat room. */
    async receiveUserMessage(message: string, user: User): Promise<void> {
        try {
            // Update our busy state.
            this.setBusyState(true);

            if (message?.trim() !== '') {
                // Add this message to the conversation.
                const name = user.displayName ?? user.userName;
                const newMessage = new HumanMessage(message, { id: createIdForMessage(), name: name });
                setSpeakerOnMessage(newMessage, { speakerType: 'user', speakerId: user._id.toString(), name: name });
                this.messages.push(newMessage);

                // Trigger the event so observers pick it up.
                this._events.next(<ChatRoomMessageEvent>{
                    eventType: 'new-chat-message',
                    chatRoomId: this.data._id!,
                    agentId: user._id,
                    agentType: 'user',
                    dateTime: new Date(),
                    message: newMessage,
                    messageId: newMessage.id!,
                });

                // Update the messages in the database.
                await this.saveConversation();
            }

            // Execute the chat messages.
            await this.executeTurnsForChatMessage();

        } catch (err) {
            console.error(err);
        } finally {
            // Update our busy state.
            this.setBusyState(false);
        }
    }

    /** After a user message is received, this is the process for executing each chat job. */
    protected async executeTurnsForChatMessage(): Promise<void> {
        // Execute the jobs for this chat room.
        for (let j of this.chatJobs.filter(j => !j.instanceData.disabled)) {
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
            const agent = this.agents.find(a => a.data._id.equals(job.agentId));

            // If there's no agent, then there's nothing we can do here.  We're also
            //  exiting gracefully, to allow the process to keep going.
            if (!agent) {
                console.warn(`No agent was found for the chat job: ${job.myName}`);
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

            // Set the properties on all of the plugins.
            plugins.forEach(p => {
                p.agent = agent;
                p.chatRoom = this;
                p.chatJob = job;
            });

            // Create the lifetime contributors for this chat interaction.
            const contributors: IChatLifetimeContributor[] = [
                agent,
                job,
                this,
                ...plugins,
                ...this.externalLifetimeServices
            ];

            contributors.sort((c1, c2) => {
                const order1 = c1.priority ?? 0;
                const order2 = c2.priority ?? 0;

                return order1 - order2;
            });

            // Create the graph state to call the chat.
            const graphState: typeof ChatCallState.State = {
                chatModel: agent.chatModel,
                lifetimeContributors: contributors,
                messageHistory: history,
            };

            // Create the graph instance.
            const graph = createChatRoomGraph();

            // Execute the chat call.
            const result = graph.streamEvents(graphState, { version: 'v2', recursionLimit: 40 });
            const newMessages = [];
            let lastEvent: StreamEvent | undefined = undefined;
            let currentMessageId: string = '';
            for await (const ev of result) {
                if (this.abortSignal?.aborted) {
                    break;
                }

                if (ev.event === 'on_chat_model_stream') {
                    const chunk = ev.data.chunk as AIMessageChunk;
                    newMessages[newMessages.length - 1] += chunk.content;
                    this.chatRoomSocketServer.sendNewChatMessageChunk({
                        chatRoomId: this.data._id,
                        messageId: chunk.id!,
                        chunk: chunk.text,
                        speakerId: this._currentlyExecutingJob.agentId!,
                        speakerName: this._agents.find(a => a.data._id.equals(this._currentlyExecutingJob!.agentId!))?.myName ?? ''
                    });

                } else if (ev.event === 'on_chat_model_start') {
                    newMessages.push('');
                }

                lastEvent = ev;
            }

            if (this.abortSignal?.aborted) {
                await result.cancel('user aborted');
                const newAiMessages = newMessages.map(m => {
                    const nm = new AIMessage(m);
                    nm.name = agent.myName ?? '';
                    nm.id = createIdForMessage();
                    if (!nm.additional_kwargs) {
                        nm.additional_kwargs = {};
                    }
                    nm.additional_kwargs.id = nm.id;
                    setSpeakerOnMessage(nm, { speakerId: agent.data._id.toString(), speakerType: 'agent', name: nm.name });
                    return nm;
                });

                // Add these to the conversation, and save them.
                this.messages.push(...newAiMessages);
            } else {
                // Update the chat history.
                const lastMessage = (lastEvent?.data.output) as typeof ChatState.State | undefined;
                if (lastMessage) {
                    this.messages = lastMessage.messageHistory;
                } else {
                    throw new Error(`Expected messages to be returned from call graph, but got none.`);
                }
            }

            await this.saveConversation();

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
        await this.chatRoomDbService.updateChatRoomConversation(this.data._id, this.data.conversation);
    }

    async saveChatRoom(): Promise<void> {
        this.updateDataForStorage();
        await this.chatRoomDbService.updateChatRoom(this.data._id, this.data);
    }

    /** Logs an error to the database, for this chat room. */
    protected async logError(error: object) {
        console.error(error);
        await this.chatRoomDbService.addChatRoomLog(this.data._id, error);
    }

    /** The current chat job that's being processed, if any. */
    private _currentlyExecutingJob: ChatJob | undefined;

    async chatComplete(finalMessages: BaseMessage[], newMessages: BaseMessage[]): Promise<void> {
        // Get the final message.
        const finalMessage = newMessages[newMessages.length - 1];

        // Get the last message.
        this._events.next(<ChatRoomMessageEvent>{
            agentId: this._currentlyExecutingJob!.agentId,
            agentType: 'agent',
            chatRoomId: this.data._id,
            dateTime: new Date(),
            eventType: 'new-chat-message',
            message: finalMessage,
            messageId: finalMessage.id!,
        });
    }
}
