import { ChatRoomDbService } from "../../database/chat-core/chat-room-db.service";
import { SocketServer } from "../socket.server";
import { SocketServiceBase } from "./socket-server-base.socket-service";
import { AgentServiceFactory } from "../../chat-core/agent-factory.service";
import { IPluginResolver } from "../../chat-core/agent-plugin/plugin-resolver.interface";
import { AgentDbService } from "../../database/chat-core/agent-db.service";
import { JobHydrator } from "../../chat-core/chat-room/chat-job.hydrator.service";
import { MESSAGE_CHUNK_MESSAGE, MessageChunkMessage } from "../../model/shared-models/chat-core/socket-messaging/message-chunk-message.socket-model";
import { ENTER_CHAT_ROOM, EnterChatRoomMessage, EXIT_CHAT_ROOM, ExitChatRoomMessage, getChatRoomRoomName } from "../../model/shared-models/chat-core/socket-messaging/general-messaging.socket-model";
import { BaseMessage, mapChatMessagesToStoredMessages, StoredMessage } from "@langchain/core/messages";
import { ObjectId } from "mongodb";
import { ChatMessageUpdatedMessage, MESSAGE_UPDATED_MESSAGE } from "../../model/shared-models/chat-core/socket-messaging/chat-message-updated-message.socket-model";


export class ChatRoomSocketServer extends SocketServiceBase {
    constructor(
        socketServer: SocketServer,
        readonly chatDbService: ChatRoomDbService,
        readonly agentServiceFactory: AgentServiceFactory,
        readonly pluginResolver: IPluginResolver,
        readonly hydratorService: JobHydrator,
        readonly agentDbService: AgentDbService,
    ) {
        super(socketServer);
    }

    async initialize(): Promise<void> {
        this.socketServer.subscribeToEvent(ENTER_CHAT_ROOM).subscribe((ev) => {
            const args = ev.data[0] as EnterChatRoomMessage;
            this.socketServer.joinRoom(ev.socket, getChatRoomRoomName(args.roomId));
        });

        this.socketServer.subscribeToEvent(EXIT_CHAT_ROOM).subscribe(ev => {
            const args = ev.data[0] as ExitChatRoomMessage;
            this.socketServer.leaveRoom(ev.socket, getChatRoomRoomName(args.roomId));
        });
    }

    /** Sends a message fragment to listeners of a specified chat room, which is a streamed portion of an LLM response. */
    async sendNewChatMessageChunk(messageChunk: MessageChunkMessage): Promise<void> {
        this.socketServer.sendMessageToRoom(getChatRoomRoomName(messageChunk.chatRoomId), MESSAGE_CHUNK_MESSAGE, messageChunk);
    }

    /** Sends an updated message to listeners of a specified chat room. */
    async sendUpdateMessageToRoom(roomId: ObjectId, message: BaseMessage | StoredMessage) {
        let storedMessage: StoredMessage;
        if (!('data' in message)) {
            // Convert to a stored message.
            storedMessage = mapChatMessagesToStoredMessages([message])[0];
        } else {
            storedMessage = message;
        }

        // Set the message to the client.
        this.socketServer.sendMessageToRoom(getChatRoomRoomName(roomId), MESSAGE_UPDATED_MESSAGE, { chatRoomId: roomId, message: storedMessage } as ChatMessageUpdatedMessage);
    }

}


