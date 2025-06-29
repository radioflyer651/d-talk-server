import { HumanMessage } from "@langchain/core/messages";
import { Agent } from "../agent.service";
import { ChatRoomData } from "./chat-room-data.model";
import { User } from "../../../model/shared-models/user.model";
import { Subject } from "rxjs";
import { IChatRoomEvent } from "../../../model/shared-models/chat-core/chat-room-event.model";
import { ChatRoomMessageEvent } from "../../../model/shared-models/chat-core/chat-room-events.model";
import { ChatDbService } from "../../../database/chat-db.service";
import { ChatRoomBusyStateEvent } from "../../../model/shared-models/chat-core/chat-room-busy-state.model";
import { IPluginResolver } from "../../agent-plugin/i-plugin-resolver.service";
import { ChatJob } from "./chat-job.service";
import { AgentServiceFactory } from "../../agent-factory.service";

export class ChatRoom {
    constructor(
        readonly data: ChatRoomData,
        readonly agentFactory: AgentServiceFactory,
        readonly chatDbService: ChatDbService,
        readonly pluginResolver: IPluginResolver,
    ) {

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

    async initialize() {
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
        const jobs = this.data.jobs.map(j => new ChatJob(j));

        const plugins = jobs.map(async j => {

        });
    }

    private _chatJobs: ChatJob[] = [];
    get chatJobs(): ChatJob[] {
        return this._chatJobs;
    }
    set chatJobs(value: ChatJob[]) {
        this._chatJobs = value;
    }

    async receiveUserMessage(message: string, user: User): Promise<void> {
        try {
            // Update our busy state.
            this.setBusyState(true);

            // Trigger the event so observers pick it up.
            this._events.next(<ChatRoomMessageEvent>{
                chatRoomId: this.data._id!,
                agentId: user._id,
                agentType: 'user',
                dateTime: new Date(),
                eventType: 'chat-message',
                message: message
            });

            // Add this message to the conversation.
            this.data.conversation.push(new HumanMessage(message, { name: user.displayName ?? user.userName }));

            // Update the messages in the database.
            this.chatDbService.updateChatRoomConversation(this.data._id, this.data.conversation);

            // Update our busy state.
            this.setBusyState(false);
        } catch (err) {

        }
    }

    protected async executeTurnsForChatMessage(): Promise<void> {

    }


}
