import { ObjectId } from "mongodb";
import { ChatRoom } from "../chat-room/chat-room.service";
import { ChatRoomDbService } from "../../database/chat-core/chat-room-db.service";
import { AgentServiceFactory } from "../agent-factory.service";
import { AgentDbService } from "../../database/chat-core/agent-db.service";
import { IPluginResolver } from "../agent-plugin/plugin-resolver.interface";
import { IJobHydratorService } from "../chat-room/chat-job-hydrator.interface";
import { filter } from "rxjs";
import { BaseMessage } from "@langchain/core/messages";
import { ChatRoomMessageEvent } from "../../model/shared-models/chat-core/chat-room-events.model";
import { AuthDbService } from "../../database/auth-db.service";
import { User } from "../../model/shared-models/user.model";
import { ChatRoomSocketServer } from "../../server/socket-services/chat-room.socket-service";


/** Responsible for accepting chat calls, typically from the API, and dispatching the request, and returning messages. */
export class ChattingService {
    constructor(
        readonly agentFactoryService: AgentServiceFactory,
        readonly chatRoomDbService: ChatRoomDbService,
        readonly pluginResolver: IPluginResolver,
        readonly jobHydratorService: IJobHydratorService,
        readonly agentDbService: AgentDbService,
        readonly authDbService: AuthDbService,
        readonly chatRoomSocketServer: ChatRoomSocketServer,
    ) {

    }

    async receiveChatMessage(chatRoomId: ObjectId, message: string, userOrUserId: ObjectId | User, signal?: AbortSignal) {
        // Get the data from the database.
        const chatRoomData = await this.chatRoomDbService.getChatRoomById(chatRoomId);

        if (!chatRoomData) {
            throw new Error(`No chat room exists with the id ${chatRoomId}`);
        }

        // Get the user, if needed.
        let user: User | undefined;
        if (userOrUserId instanceof ObjectId) {
            user = await this.authDbService.getUserById(userOrUserId);
        } else {
            user = userOrUserId;
        }

        // Validate the user.
        if (!user) {
            throw new Error(`No user was found with the specified ID.`);
        }

        // Create the chat room.
        const chatRoom = new ChatRoom(
            chatRoomData,
            this.agentFactoryService,
            this.chatRoomDbService,
            this.pluginResolver,
            this.jobHydratorService,
            this.agentDbService,
            this.chatRoomSocketServer);
            
        // Set the abort signal, in case we have one.
        chatRoom.abortSignal = signal;

        // Make sure it's initialized.
        await chatRoom.startupInitialization();

        // Subscribe to its messages.
        const newMessages: BaseMessage[] = [];
        const messageSubscription = chatRoom.events.pipe(
            filter(e => e.eventType === 'new-chat-message')
        ).subscribe((baseEvent) => {
            // Recast for typescript.
            const event = baseEvent as ChatRoomMessageEvent;
            newMessages.push(event.message);
        });

        // Make the chat call, and wait for it to complete.
        //  The data will be placed in the newMessages.
        await chatRoom.receiveUserMessage(message, user);

        // Cleanup our subscription.
        messageSubscription.unsubscribe();

        // Return the messages.
        return newMessages;
    }
}