import { getAppConfig } from "./config";
import { AuthDbService } from "./database/auth-db.service";
import { ChatJobDbService } from "./database/chat-core/chat-job-db.service";
import { ChatRoomDbService } from "./database/chat-core/chat-room-db.service";
import { ProjectDbService } from "./database/chat-core/project-db.service";
import { LogDbService } from "./database/log-db.service";
import { MongoHelper } from "./mongo-helper";
import { AuthService } from "./services/auth-service";
import { AgentDbService } from "./database/chat-core/agent-db.service";
import { ChatCoreService } from "./services/chat-core.service";
import { AgentServiceFactory } from "./chat-core/agent-factory.service";
import { ModelServiceResolver } from "./chat-core/agent/model-services/model-service-resolver";
import { AppPluginResolver } from "./chat-core/agent-plugin/app-plugin-resolver.service";
import { JobHydrator } from "./chat-core/chat-room/chat-job.hydrator.service";
import { modelResolverServices } from "./model-service-instances";
import { initializePluginTypeResolvers, pluginTypeResolvers } from "./plugin-type-resolvers";
import { SocketServer } from "./server/socket.server";
import { AgentInstanceDbService } from "./database/chat-core/agent-instance-db.service";
import { ChatRoomHydratorService } from "./chat-core/chat-room/chat-room-hydrator.service";
import { ChatDocumentDbService } from "./database/chat-core/chat-document-db.service";
/** If we were using dependency injection, this would be the DI services we'd inject in the necessary places. */

/** The mongo helper used in all DB Services. */
export let dbHelper: MongoHelper;
export let authDbService: AuthDbService;
export let loggingService: LogDbService;

// Chat-Core DB services.
export let projectDbService: ProjectDbService;
export let agentDbService: AgentDbService;
export let chatJobDbService: ChatJobDbService;
export let chatRoomDbService: ChatRoomDbService;
export let agentInstanceDbService: AgentInstanceDbService;
export let chatDocumentDbService: ChatDocumentDbService;

// Chat-Core services.
export let agentServiceFactory: AgentServiceFactory;
export let modelResolver: ModelServiceResolver;
export let pluginResolver: AppPluginResolver;
export let jobHydratorService: JobHydrator;
export let chatRoomHydratorService: ChatRoomHydratorService;

/* App Services. */
export let authService: AuthService;
export let chatCoreService: ChatCoreService;
export let socketServer: SocketServer;

/** Initializes the services used in the application. */
export async function initializeServices(): Promise<void> {
    // Load the configuration.
    const config = await getAppConfig();

    /** The mongo helper used in all DB Services. */
    dbHelper = new MongoHelper(config.mongo.connectionString, config.mongo.databaseName);
    await dbHelper.connect();

    /* All DB Services. */
    loggingService = new LogDbService(dbHelper);
    chatJobDbService = new ChatJobDbService(dbHelper);
    chatRoomDbService = new ChatRoomDbService(dbHelper);
    authDbService = new AuthDbService(dbHelper);
    projectDbService = new ProjectDbService(dbHelper);
    agentDbService = new AgentDbService(dbHelper);
    agentInstanceDbService = new AgentInstanceDbService(dbHelper);
    chatDocumentDbService = new ChatDocumentDbService(dbHelper);

    /* App Services. */
    authService = new AuthService(authDbService, loggingService);
    socketServer = new SocketServer(loggingService);

    // Chat-Core
    chatCoreService = new ChatCoreService(
        agentDbService,
        agentInstanceDbService,
        chatRoomDbService,
        chatJobDbService,
        projectDbService
    );
    modelResolver = new ModelServiceResolver(modelResolverServices);
    await initializePluginTypeResolvers(config);
    pluginResolver = new AppPluginResolver(pluginTypeResolvers);
    agentServiceFactory = new AgentServiceFactory(modelResolver, pluginResolver, agentDbService, agentInstanceDbService);
    jobHydratorService = new JobHydrator(chatRoomDbService, pluginResolver, chatJobDbService);
    chatRoomHydratorService = new ChatRoomHydratorService(
        agentServiceFactory,
        chatRoomDbService,
        pluginResolver,
        jobHydratorService,
        agentDbService,
        agentInstanceDbService,
        projectDbService,
    );


}