import { chatRoomDbService, agentServiceFactory, pluginResolver, jobHydratorService, agentDbService, authDbService, agentInstanceDbService, chatRoomHydratorService, chatDocumentDbService, projectDbService, voiceChatReferenceDbService, awsBucketService } from "./app-globals";
import { ChattingService } from "./chat-core/chatting/chatting.service";
import { textDocumentResolver } from "./document-type-resolvers";
import { IAppConfig } from "./model/app-config.model";
import { ChatRoomSocketServer } from "./server/socket-services/chat-room.socket-service";
import { TextDocumentSocketService } from "./server/socket-services/text-document.socket-service";
import { SocketServer } from "./server/socket.server";
import { VoiceChatService } from "./services/voice-chat-services/voice-chat.service";
import { getVoiceChatProviders } from "./voice-chat-providers";

// Placeholder for future socket services.
export let chatRoomSocketServer: ChatRoomSocketServer;
export let textDocumentSocketServer: TextDocumentSocketService;
export let chattingService: ChattingService;
export let voiceChatService: VoiceChatService;

/** Sets up all socket servers/services that are based on the socketServer. */
export async function setupSocketServices(socketServer: SocketServer, config: IAppConfig): Promise<void> {
    // adminSocketService = new AdminSocketService(socketServer);
    // await adminSocketService.initialize();
    
    chatRoomSocketServer = new ChatRoomSocketServer(socketServer,
        chatRoomDbService,
        agentServiceFactory,
        pluginResolver,
        jobHydratorService,
        agentDbService);
    await chatRoomSocketServer.initialize();

    textDocumentSocketServer = new TextDocumentSocketService(
        socketServer,
        chatDocumentDbService,
        projectDbService,
    );
    await textDocumentSocketServer.initialize();
    // This shouldn't have to be here... It's shameful.
    textDocumentResolver.textDocumentSocketService = textDocumentSocketServer;

    chattingService = new ChattingService(
        agentServiceFactory,
        chatRoomDbService,
        pluginResolver,
        jobHydratorService,
        agentDbService,
        authDbService,
        chatRoomSocketServer,
        agentInstanceDbService,
        chatRoomHydratorService);

    // Stupid socket servers have to be initialized here because they need the chatting service.
    voiceChatService = new VoiceChatService(config, await getVoiceChatProviders(config), voiceChatReferenceDbService, awsBucketService, chatRoomDbService, agentDbService, agentInstanceDbService, chatRoomSocketServer);
}