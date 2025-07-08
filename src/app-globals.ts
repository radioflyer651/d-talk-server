import { getAppConfig } from "./config";
import { AuthDbService } from "./database/auth-db.service";
import { ChatJobDbService } from "./database/chat-core/chat-job-db.service";
import { ChatRoomDbService } from "./database/chat-core/chat-room-db.service";
import { PluginDbService } from "./database/chat-core/plugin-db.service";
import { ProjectDbService } from "./database/chat-core/project-db.service";
import { LogDbService } from "./database/log-db.service";
import { MongoHelper } from "./mongo-helper";
import { AuthService } from "./services/auth-service";
import { AgentDbService } from "./database/chat-core/agent-db.service";
import { ChatCoreService } from "./services/chat-core.service";
import { ChattingService } from "./chat-core/chatting/chatting.service";
import { AgentServiceFactory } from "./chat-core/agent-factory.service";
import { ModelServiceResolver } from "./chat-core/agent/model-services/model-service-resolver";
import { AppPluginResolver } from "./chat-core/agent-plugin/app-plugin-resolver.service";
import { JobHydrator } from "./chat-core/chat-room/chat-job.hydrater.service";
import { modelResolverServices } from "./model-service-instances";
import { pluginTypeResolvers } from "./plugin-type-resolvers";
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

// Chat-Core services.
export let chattingService: ChattingService;
export let agentServiceFactory: AgentServiceFactory;
export let modelResolver: ModelServiceResolver;
export let pluginResolver: AppPluginResolver;
export let jobHydratorService: JobHydrator;

/* App Services. */
export let authService: AuthService;
export let chatCoreService: ChatCoreService;

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

    /* App Services. */
    authService = new AuthService(authDbService, loggingService);

    // Chat-Core
    chatCoreService = new ChatCoreService(
        agentDbService,
        chatRoomDbService,
        chatJobDbService,
        projectDbService
    );
    modelResolver = new ModelServiceResolver(modelResolverServices);
    pluginResolver = new AppPluginResolver(pluginTypeResolvers)
    agentServiceFactory = new AgentServiceFactory(modelResolver, pluginResolver, agentDbService);
    jobHydratorService = new JobHydrator(chatRoomDbService, pluginResolver, chatJobDbService);

    chattingService = new ChattingService(
        agentServiceFactory,
        chatRoomDbService,
        pluginResolver,
        jobHydratorService,
        agentDbService,
        authDbService);

}