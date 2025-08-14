import { mapStoredMessagesToChatMessages, BaseMessage, HumanMessage, mapChatMessagesToStoredMessages, AIMessage, AIMessageChunk } from "@langchain/core/messages";
import { Subject } from "rxjs";
import { ChatRoomBusyStateEvent } from "../../model/shared-models/chat-core/chat-room-busy-state.model";
import { ChatRoomData } from "../../model/shared-models/chat-core/chat-room-data.model";
import { IChatRoomEvent } from "../../model/shared-models/chat-core/chat-room-event.model";
import { ChatRoomMessageChunkEvent, ChatRoomMessageEvent } from "../../model/shared-models/chat-core/chat-room-events.model";
import { User } from "../../model/shared-models/user.model";
import { AgentPluginBase, PluginAttachmentTarget } from "../agent-plugin/agent-plugin-base.service";
import { ChatCallInfo, IChatLifetimeContributor } from "../chat-lifetime-contributor.interface";
import { createIdForMessage } from "../utilities/set-message-id.util";
import { setMessageDateTimeIfMissing, setSpeakerOnMessage } from "../../model/shared-models/chat-core/utils/messages.utils";
import { ChatJob } from "./chat-job.service";
import { createChatRoomGraph } from "./chat-room-graph/chat-room.graph";
import { ChatCallState, ChatState } from "./chat-room-graph/chat-room.state";
import { Agent } from "../agent/agent.service";
import { StreamEvent } from "@langchain/core/tracers/log_stream";
import { PositionableMessage } from "../../model/shared-models/chat-core/positionable-message.model";
import { hydratePositionableMessages } from "../../utils/positionable-message-hydration.utils";
import { Project } from "../../model/shared-models/chat-core/project.model";
import { ChatDocument } from "../document/chat-document.service";
import { IDisposable } from "../disposable.interface";
import { IDocumentProvider } from "../document/document-provider.interface";
import { ChatDocumentReference } from "../../model/shared-models/chat-core/documents/chat-document-reference.model";
import { IChatRoomSaverService } from "./chat-room-saver-service.interface";
import { MessageGroupingState } from "../utilities/message-grouping-state.utils";
import { getChatRoomLongRunningTasks } from "./chat-room-long-running-tasks.service";

/*  NOTE: This service might be a little heavy, and should probably be reduced in scope at some point. */

/** Provides basic interactive functionality for sending a message, from a user, to a chat room
 *   and getting an LLM response.  */
export class ChatRoom implements IChatLifetimeContributor, IDisposable, PluginAttachmentTarget, IDocumentProvider {
    constructor(
        readonly data: ChatRoomData,
        readonly chatRoomSaverService: IChatRoomSaverService,
    ) {
        this.messages = mapStoredMessagesToChatMessages(this.data.conversation ?? []);
    }

    private _events = new Subject<IChatRoomEvent>();

    /** Events that occur during the chat. */
    readonly events = this._events.asObservable();

    dispose() {
        this._events.complete();

        // Create a set of disposables, and dispose of them all.
        [
            ...this.agents,
            ...this.chatJobs,
            ...this.documents,
        ].forEach(d => {
            d.dispose();
        });
    }

    get isBusy(): boolean {
        return this.data.isBusy;
    }

    /** Gets all documents from the provider's document list. */
    async getDocumentReferences(): Promise<ChatDocumentReference[]> {
        return this.data.chatDocumentReferences;
    }

    /** Adds a new document to the document list. */
    async addDocumentReference(newReferences: ChatDocumentReference[]): Promise<void> {
        this.data.chatDocumentReferences.push(...newReferences);
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

    private _project!: Project;
    get project(): Project {
        return this._project;
    }
    set project(value: Project) {
        this._project = value;
    }
    private _documents: ChatDocument[] = [];
    get documents(): ChatDocument[] {
        return this._documents;
    }
    set documents(value: ChatDocument[]) {
        this._documents = value;
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

    async deleteMessage(messageId: string): Promise<void> {
        // Get the message index.
        const messageIndex = this.messages.findIndex(m => m.id === messageId || m.additional_kwargs?.id === messageId);

        // If not found, then do nothing.
        if (messageIndex < 0) {
            return;
        }

        // Get an object that can help us find the related messages.
        const traverser = new MessageGroupingState(this.messages, messageIndex);

        // Get the index of the first and last related message to this message.
        const firstMessage = traverser.getFirstRelatedMessage();
        const lastMessage = traverser.getLastRelatedMessage();

        // Delete these messages.
        this.messages.splice(firstMessage.messageIndex, lastMessage.messageIndex - firstMessage.messageIndex + 1);

        // Save the messages to the DB.
        await this.saveConversation();
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
                setMessageDateTimeIfMissing(newMessage, new Date());
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

    /** Collects and stores all long running tasks from a specified set of plugins. */
    protected collectLongRunningTasks(plugins: AgentPluginBase[]): void {
        // Get the long running task service.
        const taskService = getChatRoomLongRunningTasks();

        plugins.forEach(p => {
            // Get the long running tasks for this item.
            const tasks = p.getLongRunningTasks();

            // Store them.
            tasks.forEach(t => {
                taskService.addNewTask(t);
            });
        });
    }

    /** After a user message is received, this is the process for executing each chat job. */
    protected async executeTurnsForChatMessage(): Promise<void> {
        // Execute the jobs for this chat room.
        for (let j of this.chatJobs.filter(j => !j.instanceData.disabled)) {
            await this.executeTurnForJob(j);
        }

        // Save any changes that might have occurred for this room, including chat history.
        //  NOTE: Chat history is already saved on each turn for the job (too).
        await this.chatRoomSaverService.updateChatRoom(this);
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

            // Get the documents.
            const documentContributorsP = this.documents?.map(d => d.getLifetimeContributors(this, job, agent)) ?? [];
            const documentContributors = (await Promise.all(documentContributorsP)).reduce((p, c) => [...p, ...c], []);

            // Create the lifetime contributors for this chat interaction.
            const contributors: IChatLifetimeContributor[] = [
                agent,
                job,
                this,
                ...plugins,
                ...this.externalLifetimeServices,
                ...documentContributors,
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
                logStepsToConsole: false,
                chatFormatting: agent.chatFormatting,
            };

            // Create the graph instance.
            const graph = createChatRoomGraph();

            // Execute the chat call.
            const result = graph.streamEvents(graphState, { version: 'v2', recursionLimit: 80 });
            const newMessages = [];
            let lastEvent: StreamEvent | undefined = undefined;
            try {
                for await (const ev of result) {
                    if (this.abortSignal?.aborted) {
                        break;
                    }

                    const node = ev.metadata.langgraph_node as string | undefined;
                    // if (node && !node.startsWith('t_')) {
                    if (node && node === 'chat-call') {
                        // Stream the value out to listeners.
                        if (ev.event === 'on_chat_model_stream') {
                            const chunk = ev.data.chunk as AIMessageChunk;
                            newMessages[newMessages.length - 1] += chunk.content;

                            // Send the event out, so potentially a socket can send this message part to the UI.
                            this._events.next(<ChatRoomMessageChunkEvent>{
                                eventType: 'new-chat-message-chunk',
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
                }
            } catch (err) {
                console.error(`Error running main graph. ${err?.toString() ?? ''}`);
                this.logError(err as any);
            }


            if (this.abortSignal?.aborted) {
                try {
                    await result.cancel('user aborted');
                } catch (err) {
                    // This shouldn't happen, but just in case.
                    console.error(`Error caught when cancelling LLM stream.`, err);
                }

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
                    this.logError({ message: `Expected messages to be returned from call graph, but got none.` });
                    throw new Error(`Expected messages to be returned from call graph, but got none.`);
                }
            }

            // Save all components of this call.  (This might be overkill, and change detection might be a better approach in the future.)
            const agentUpdateP = this.chatRoomSaverService.updateChatAgent(agent);
            const jobUpdateP = this.chatRoomSaverService.updateChatJob(job);
            this.updateDataForStorage();
            const conversationUpdateP = this.chatRoomSaverService.updateChatRoomConversation(this);
            await Promise.all([agentUpdateP, jobUpdateP, conversationUpdateP]);

            // Store the long running tasks from the plugins.
            this.collectLongRunningTasks(plugins);

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

    async addPreChatMessages?(info: ChatCallInfo): Promise<PositionableMessage<BaseMessage>[]> {
        // Collect the messages we want.
        const roomMessages = this.data.roomInstructions ?? [];
        const projectMessages = this.project.projectKnowledge ?? []; // This functionality should probably move to another location (making a project a lifetime contributor.)
        const allMessages = [...roomMessages, ...projectMessages];

        // If we don't have any roomInstructions, then there's nothing to do.
        if (allMessages.length < 1) {
            return [];
        }

        // Add the messages for the room onto the call history.
        return hydratePositionableMessages(allMessages);
    }

    /** Updates the data property on this chat room, synchronizing it with the chat room data. */
    public updateDataForStorage(): void {
        if (!this.messages) {
            throw new Error(`No messages to set.`);
        }

        this.data.conversation = mapChatMessagesToStoredMessages(this.messages!);
    }

    /** Saves the state of the chat room. */
    protected async saveConversation(): Promise<void> {
        this.updateDataForStorage();
        await this.chatRoomSaverService.updateChatRoomConversation(this);
    }

    async saveChatRoom(): Promise<void> {
        this.updateDataForStorage();
        await this.chatRoomSaverService.updateChatRoom(this);
    }

    /** Logs an error to the database, for this chat room. */
    protected async logError(error: object) {
        console.error(error);
        await this.chatRoomSaverService.addChatRoomLog(this.data._id, {
            type: 'error',
            error
        });
    }

    /** The current chat job that's being processed, if any. */
    private _currentlyExecutingJob: ChatJob | undefined;

    async chatComplete(finalMessages: BaseMessage[], newMessages: BaseMessage[]): Promise<void> {
        // Emit all new messages.
        newMessages.forEach(m => {
            // Get the last message.
            this._events.next(<ChatRoomMessageEvent>{
                agentId: this._currentlyExecutingJob!.agentId,
                agentType: 'agent',
                chatRoomId: this.data._id,
                dateTime: new Date(),
                eventType: 'new-chat-message',
                message: m,
                messageId: m.id!,
            });

        });
    }
}
