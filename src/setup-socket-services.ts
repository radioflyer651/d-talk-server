import { chatRoomDbService, agentServiceFactory, pluginResolver, jobHydratorService, agentDbService, authDbService } from "./app-globals";
import { ChattingService } from "./chat-core/chatting/chatting.service";
import { ChatRoomSocketServer } from "./server/socket-services/chat-room.socket-service";
import { SocketServer } from "./server/socket.server";

// Placeholder for future socket services.
export let chatRoomSocketServer: ChatRoomSocketServer;
export let chattingService: ChattingService;

/** Sets up all socket servers/services that are based on the socketServer. */
export async function setupSocketServices(socketServer: SocketServer): Promise<void> {
    // mainChatSocketService = new ChatSocketService(socketServer, appChatService, llmChatService, chatDbService, adminDbService);
    // await mainChatSocketService.initialize();

    // tarotSocketServer = new TarotSocketService(socketServer, companyDbService, tarotDbService, llmChatService, appChatService, chatDbService);
    // await tarotSocketServer.initialize();

    // adminSocketService = new AdminSocketService(socketServer);
    // await adminSocketService.initialize();
    chatRoomSocketServer = new ChatRoomSocketServer(socketServer,
        chatRoomDbService,
        agentServiceFactory,
        pluginResolver,
        jobHydratorService,
        agentDbService);
    chatRoomSocketServer.initialize();


    chattingService = new ChattingService(
        agentServiceFactory,
        chatRoomDbService,
        pluginResolver,
        jobHydratorService,
        agentDbService,
        authDbService,
        chatRoomSocketServer);
}