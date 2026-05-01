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
import { initializePluginTypeResolvers, pluginTypeResolvers } from "./plugin-type-resolvers";
import { SocketServer } from "./server/socket.server";
import { AgentInstanceDbService } from "./database/chat-core/agent-instance-db.service";
import { ChatRoomHydratorService } from "./chat-core/chat-room/chat-room-hydrator.service";
import { ChatDocumentDbService } from "./database/chat-core/chat-document-db.service";
import { ChatDocumentResolutionService } from "./chat-core/document/document-resolution.service";
import { documentTypeResolvers, initializeDocumentTypeResolvers, textDocumentResolver } from "./document-type-resolvers";
import { OllamaModelConfigurationDbService as OllamaModelConfigDbService } from "./database/chat-core/ollama-configurations-db.service";
import { OllamaAiAgentService } from "./chat-core/agent/model-services/ollama.model-service-service";
import { OpenAiAgentService } from "./chat-core/agent/model-services/open-model-service";
import { IChatRoomSaverService } from "./chat-core/chat-room/chat-room-saver-service.interface";
import { ChatRoomSaverService } from "./chat-core/chat-room/chat-room-saver.service";
import { VoiceFileReferenceDbService } from "./database/chat-core/voice-file-reference-db.service";
import { AwsS3BucketService } from "./services/aws-s3-bucket.service";
import { DbUpdateServiceDb } from "./database/db-update-db.service";
import { ChatCloningService } from "./chat-core/cloning/chat-cloning.service";
/**
 * Composition root — all services are constructed here with their dependencies passed
 * via constructor arguments (manual dependency injection). This is the single place where
 * the object graph is assembled. To add a new service: construct it in initializeServices()
 * with its dependencies, then export the variable from this file.
 *
 * Note: a decorator-based DI framework (tsyringe, inversify) would require enabling
 * `emitDecoratorMetadata` in tsconfig. Until that is done and a test suite exists to
 * validate the refactor, keep wiring here.
 */

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
export let ollamaModelConfigDbService: OllamaModelConfigDbService;
export let voiceChatReferenceDbService: VoiceFileReferenceDbService;
export let dbUpdateDbService: DbUpdateServiceDb;

// Chat-Core services.
export let chatRoomSaver: IChatRoomSaverService;
export let agentServiceFactory: AgentServiceFactory;
export let modelResolver: ModelServiceResolver;
export let pluginResolver: AppPluginResolver;
export let documentResolver: ChatDocumentResolutionService;
export let jobHydratorService: JobHydrator;
export let chatRoomHydratorService: ChatRoomHydratorService;
export let chatCloningService: ChatCloningService;

/* App Services. */
export let authService: AuthService;
export let chatCoreService: ChatCoreService;
export let socketServer: SocketServer;
export let awsBucketService: AwsS3BucketService;

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
    ollamaModelConfigDbService = new OllamaModelConfigDbService(dbHelper);
    voiceChatReferenceDbService = new VoiceFileReferenceDbService(dbHelper);
    dbUpdateDbService = new DbUpdateServiceDb(dbHelper); // Tracks executed database update scripts.

    /* App Services. */
    authService = new AuthService(authDbService, loggingService);
    socketServer = new SocketServer(loggingService);
    awsBucketService = new AwsS3BucketService(config);

    // Chat-Core
    chatRoomSaver = new ChatRoomSaverService(chatRoomDbService, chatJobDbService, agentDbService, projectDbService);
    chatCoreService = new ChatCoreService(
        agentDbService,
        agentInstanceDbService,
        chatRoomDbService,
        chatJobDbService,
        projectDbService,
        chatDocumentDbService,
    );
    chatCloningService = new ChatCloningService(agentDbService, chatJobDbService);
    modelResolver = new ModelServiceResolver([
        new OllamaAiAgentService(ollamaModelConfigDbService),
        new OpenAiAgentService(),
    ]);
    await initializeDocumentTypeResolvers(config);
    await initializePluginTypeResolvers(config, modelResolver, dbHelper, chatDocumentDbService, textDocumentResolver, authDbService, chatCoreService);
    pluginResolver = new AppPluginResolver(pluginTypeResolvers);
    documentResolver = new ChatDocumentResolutionService(documentTypeResolvers, chatDocumentDbService);
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
        documentResolver,
        chatRoomSaver,
    );


}