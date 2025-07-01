import { from, lastValueFrom, mergeMap, of } from "rxjs";
import { ChatRoomDbService } from "../../database/chat-core/chat-room-db.service";
import { SocketServer } from "../socket.server";
import { SocketServiceBase } from "./socket-server-base.socket-service";
import { ObjectId } from "mongodb";
import { IChatLifetimeContributor } from "../../chat-core/chat-lifetime-contributor.interface";
import { BaseMessage } from "@langchain/core/messages";
import { UserChatEventArgs } from "../../model/shared-models/user-chat-event.model";
import { ChatRoom } from "../../chat-core/agent/chat-room/chat-room.service";
import { AgentServiceFactory } from "../../chat-core/agent-factory.service";
import { IPluginResolver } from "../../chat-core/agent-plugin/plugin-resolver.interface";
import { JobHydrator } from "../../chat-core/agent/chat-room/chat-job.hydrater.service";
import { Socket } from "socket.io";


export class ChatRoomSocketServer extends SocketServiceBase {
    constructor(
        socketService: SocketServer,
        readonly chatDbService: ChatRoomDbService,
        readonly agentServiceFactory: AgentServiceFactory,
        readonly pluginResolver: IPluginResolver,
        readonly hydratorService: JobHydrator,
    ) {
        super(socketService);
    }

    async initialize(): Promise<void> {
        this.socketServer.subscribeToEvent('sendChatMessage')
            .pipe(mergeMap(event => {
                const args = event.data as UserChatEventArgs;
                return from(this.callChatMessage(args[0], args[1], event.userId!, event.socket));
            }));
    }

    private async callChatMessage(chatRoomId: ObjectId, message: string, userId: ObjectId, socket: Socket): Promise<void> {
        // Get the chat room for this ID.
        const roomData = await this.chatDbService.getChatRoomById(chatRoomId);

        // Validate the database data.
        if (!roomData) {
            throw new Error(`No room exists with the id: ${chatRoomId}`);
        }

        // Validate the owner.
        if (roomData.userId.equals(userId) && !roomData.userParticipants.some(p => p.equals(userId))) {
            throw new Error(`User ${userId} does not own chat room ${chatRoomId}, and is not a member of the chat room.`);
        }

        // Create the chat room from this data.
        const chatRoom = new ChatRoom(roomData,
            this.agentServiceFactory,
            this.chatDbService,
            this.pluginResolver,
            this.hydratorService);

        // Add a handler to send messages to the client when they're completed on the job.
        chatRoom.externalLifetimeServices.push({
            handleReply: async (message) => {
                if (message.getType() === 'ai' && !message.tool_calls) {
                    await this.sendChatMessage([message], socket);
                }
                
                return undefined;
            }
        });

    }

    public async sendChatMessage(newMessage: BaseMessage[], socket: Socket): Promise<void> {
        this.socketServer.emitEvent(socket, 'receive-chat-message');
    }
}
