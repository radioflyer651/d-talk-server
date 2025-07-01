import { from, lastValueFrom, mergeMap, of } from "rxjs";
import { ChatDbService } from "../../database/chat-db.service";
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
        readonly chatDbService: ChatDbService,
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

        // Hook up the services to the chat room.
        chatRoom.externalLifetimeServices.push(new MessageWatcherPlugin(this, socket));


    }

    public async sendChatMessage(newMessage: BaseMessage[], socket: Socket): Promise<void> {
        this.socketServer.emitEvent(socket,);
    }
}

class MessageWatcherPlugin implements IChatLifetimeContributor {
    constructor(
        readonly chatRoomSocketServer: ChatRoomSocketServer,
        readonly socket: Socket,
    ) {

    }

    async chatComplete(finalMessages: BaseMessage[], newMessages: BaseMessage[]): Promise<void> {
        this.chatRoomSocketServer.sendChatMessage(newMessages, this.socket);
    }
}