import { Container } from 'inversify';
import { TOKENS } from './tokens';
import { getAppConfig } from './config';
import { MongoHelper } from './mongo-helper';

// DB Services
import { LogDbService } from './database/log-db.service';
import { AuthDbService } from './database/auth-db.service';
import { ProjectDbService } from './database/chat-core/project-db.service';
import { AgentDbService } from './database/chat-core/agent-db.service';
import { ChatJobDbService } from './database/chat-core/chat-job-db.service';
import { ChatRoomDbService } from './database/chat-core/chat-room-db.service';
import { AgentInstanceDbService } from './database/chat-core/agent-instance-db.service';
import { ChatDocumentDbService } from './database/chat-core/chat-document-db.service';
import { OllamaModelConfigurationDbService } from './database/chat-core/ollama-configurations-db.service';
import { VoiceFileReferenceDbService } from './database/chat-core/voice-file-reference-db.service';
import { DbUpdateServiceDb } from './database/db-update-db.service';

// App Services
import { AuthService } from './services/auth-service';
import { AwsS3BucketService } from './services/aws-s3-bucket.service';
import { ChatCoreService } from './services/chat-core.service';
import { ChatCloningService } from './chat-core/cloning/chat-cloning.service';

// Chat-Core
import { ModelServiceResolver } from './chat-core/agent/model-services/model-service-resolver';
import { OllamaAiAgentService } from './chat-core/agent/model-services/ollama.model-service-service';
import { OpenAiAgentService } from './chat-core/agent/model-services/open-model-service';
import { AppPluginResolver } from './chat-core/agent-plugin/app-plugin-resolver.service';
import { ChatDocumentResolutionService } from './chat-core/document/document-resolution.service';
import { AgentServiceFactory } from './chat-core/agent-factory.service';
import { JobHydrator } from './chat-core/chat-room/chat-job.hydrator.service';
import { ChatRoomHydratorService } from './chat-core/chat-room/chat-room-hydrator.service';
import { ChatRoomSaverService } from './chat-core/chat-room/chat-room-saver.service';
import { TextDocumentResolver } from './chat-core/document/resolvers/text-document.resolver';
import { IPluginTypeResolver } from './chat-core/agent-plugin/i-plugin-type-resolver';

// Plugin resolvers — stateless ones constructed directly; stateful ones via toDynamicValue
import { ArithmeticPluginResolver } from './chat-core/plugin-implementations/plugin-resolver-services/arithmetic-plugin-resolver';
import { ActDrunkPluginResolver } from './chat-core/plugin-implementations/plugin-resolver-services/act-drunk.plugin-resolver';
import { DebugPluginResolver } from './chat-core/plugin-implementations/plugin-resolver-services/dbug.plugin-resolver';
import { OtherAgentMessagesAsUserPluginResolver } from './chat-core/plugin-implementations/plugin-resolver-services/other-agent-messages-as-user.plugin-resolver';
import { OtherAgentsInvisiblePluginResolver } from './chat-core/plugin-implementations/plugin-resolver-services/other-agents-invisible.plugin-resolver';
import { RoomInfoPluginResolver } from './chat-core/plugin-implementations/plugin-resolver-services/room-info.plugin-resolver';
import { UserMessagesIgnoredPluginResolver } from './chat-core/plugin-implementations/plugin-resolver-services/user-messages-ignored.plugin-resolver';
import { LabelAgentSpeakersPluginResolver } from './chat-core/plugin-implementations/plugin-resolver-services/label-agent-speakers-plugin-resolver';
import { IgnoreSpecificAgentPluginResolver } from './chat-core/plugin-implementations/plugin-resolver-services/ignore-specific-agent-plugin-resolver';
import { WebSearchPluginResolver } from './chat-core/plugin-implementations/plugin-resolver-services/web-search.plugin-resolver';
import { LabeledMemoryPluginResolver } from './chat-core/plugin-implementations/plugin-resolver-services/labeled-memory-plugin-resolver';
import { LabeledMemory2PluginResolver } from './chat-core/plugin-implementations/plugin-resolver-services/labeled-memory2-plugin-resolver';
import { CreateTextDocumentsPluginResolver } from './chat-core/plugin-implementations/plugin-resolver-services/create-text-documents-plugin-resolver';
import { RandomChoicePluginResolver } from './chat-core/plugin-implementations/plugin-resolver-services/random-choice-plugin-resolver';
import { ManageDocumentFolderPluginResolver } from './chat-core/plugin-implementations/plugin-resolver-services/manage-document-folder-plugin-resolver';
import { CurrentTimeAndDatePluginResolver } from './chat-core/plugin-implementations/plugin-resolver-services/current-time-and-date-plugin-resolver';
import { InnerVoicePluginResolver } from './chat-core/plugin-implementations/plugin-resolver-services/inner-voice-plugin-resolver';
import { ShortenedChatHistoryPluginResolver } from './chat-core/plugin-implementations/plugin-resolver-services/shortened-chat-history-plugin-resolver';
import { HideMessagesFromOtherAgentsPluginResolver } from './chat-core/plugin-implementations/plugin-resolver-services/hide-messages-from-other-agents.plugin-resolver';
import { PromptToolCallingPluginResolver } from './chat-core/plugin-implementations/plugin-resolver-services/prompt-tool-calling-plugin-resolver';
import { SubAgentPluginResolver } from './chat-core/plugin-implementations/plugin-resolver-services/sub-agent-plugin-resolver';

// Socket / Real-time
import { SocketServer } from './server/socket.server';
import { ChatRoomSocketServer } from './server/socket-services/chat-room.socket-service';
import { TextDocumentSocketService } from './server/socket-services/text-document.socket-service';
import { ChattingService } from './chat-core/chatting/chatting.service';
import { VoiceChatService } from './services/voice-chat-services/voice-chat.service';
import { HumeVoiceChatService } from './services/voice-chat-services/hume-voice-chat.service';
import { OpenAiVoiceChatService } from './services/voice-chat-services/openai-voice-chat.service';
import { IVoiceChatProvider } from './services/voice-chat-services/voice-chat-provider.interface';

/** Builds and returns the fully-wired Inversify container.
 *  All services are singletons resolved lazily on first request.
 *  Async factories (connect, initialize) run inline the first time a token is resolved. */
export async function buildContainer(): Promise<Container> {
    const config = await getAppConfig();
    // defaultScope: Singleton ensures each token is only ever instantiated once.
    const container = new Container({ defaultScope: 'Singleton' });

    // ── Config ───────────────────────────────────────────────────────────────
    container.bind(TOKENS.AppConfig).toConstantValue(config);

    // ── MongoDB ───────────────────────────────────────────────────────────────
    // connect() is awaited inline; thereafter every DB service reuses this single client.
    container.bind<MongoHelper>(TOKENS.MongoHelper).toDynamicValue(async () => {
        const helper = new MongoHelper(config.mongo.connectionString, config.mongo.databaseName);
        await helper.connect();
        return helper;
    }).inSingletonScope();

    // ── DB Services ───────────────────────────────────────────────────────────
    // All share the same MongoHelper instance. Pattern is uniform across all 11 services.
    container.bind(TOKENS.LogDbService).toDynamicValue(async (ctx) =>
        new LogDbService(await ctx.container.getAsync(TOKENS.MongoHelper))
    ).inSingletonScope();

    container.bind(TOKENS.AuthDbService).toDynamicValue(async (ctx) =>
        new AuthDbService(await ctx.container.getAsync(TOKENS.MongoHelper))
    ).inSingletonScope();

    container.bind(TOKENS.ProjectDbService).toDynamicValue(async (ctx) =>
        new ProjectDbService(await ctx.container.getAsync(TOKENS.MongoHelper))
    ).inSingletonScope();

    container.bind(TOKENS.AgentDbService).toDynamicValue(async (ctx) =>
        new AgentDbService(await ctx.container.getAsync(TOKENS.MongoHelper))
    ).inSingletonScope();

    container.bind(TOKENS.ChatJobDbService).toDynamicValue(async (ctx) =>
        new ChatJobDbService(await ctx.container.getAsync(TOKENS.MongoHelper))
    ).inSingletonScope();

    container.bind(TOKENS.ChatRoomDbService).toDynamicValue(async (ctx) =>
        new ChatRoomDbService(await ctx.container.getAsync(TOKENS.MongoHelper))
    ).inSingletonScope();

    container.bind(TOKENS.AgentInstanceDbService).toDynamicValue(async (ctx) =>
        new AgentInstanceDbService(await ctx.container.getAsync(TOKENS.MongoHelper))
    ).inSingletonScope();

    container.bind(TOKENS.ChatDocumentDbService).toDynamicValue(async (ctx) =>
        new ChatDocumentDbService(await ctx.container.getAsync(TOKENS.MongoHelper))
    ).inSingletonScope();

    container.bind(TOKENS.OllamaModelConfigDbService).toDynamicValue(async (ctx) =>
        new OllamaModelConfigurationDbService(await ctx.container.getAsync(TOKENS.MongoHelper))
    ).inSingletonScope();

    container.bind(TOKENS.VoiceFileReferenceDbService).toDynamicValue(async (ctx) =>
        new VoiceFileReferenceDbService(await ctx.container.getAsync(TOKENS.MongoHelper))
    ).inSingletonScope();

    container.bind(TOKENS.DbUpdateDbService).toDynamicValue(async (ctx) =>
        new DbUpdateServiceDb(await ctx.container.getAsync(TOKENS.MongoHelper))
    ).inSingletonScope();

    // ── App Services ──────────────────────────────────────────────────────────
    container.bind(TOKENS.AuthService).toDynamicValue(async (ctx) =>
        new AuthService(
            await ctx.container.getAsync(TOKENS.AuthDbService),
            await ctx.container.getAsync(TOKENS.LogDbService),
        )
    ).inSingletonScope();

    container.bind(TOKENS.AwsS3BucketService).toConstantValue(new AwsS3BucketService(config));

    container.bind(TOKENS.ChatCoreService).toDynamicValue(async (ctx) =>
        new ChatCoreService(
            await ctx.container.getAsync(TOKENS.AgentDbService),
            await ctx.container.getAsync(TOKENS.AgentInstanceDbService),
            await ctx.container.getAsync(TOKENS.ChatRoomDbService),
            await ctx.container.getAsync(TOKENS.ChatJobDbService),
            await ctx.container.getAsync(TOKENS.ProjectDbService),
            await ctx.container.getAsync(TOKENS.ChatDocumentDbService),
        )
    ).inSingletonScope();

    container.bind(TOKENS.ChatCloningService).toDynamicValue(async (ctx) =>
        new ChatCloningService(
            await ctx.container.getAsync(TOKENS.AgentDbService),
            await ctx.container.getAsync(TOKENS.ChatJobDbService),
        )
    ).inSingletonScope();

    // ── Model Resolver ────────────────────────────────────────────────────────
    // OllamaAiAgentService needs the Ollama DB service; OpenAiAgentService reads config internally.
    container.bind(TOKENS.ModelServiceResolver).toDynamicValue(async (ctx) =>
        new ModelServiceResolver([
            new OllamaAiAgentService(await ctx.container.getAsync(TOKENS.OllamaModelConfigDbService)),
            new OpenAiAgentService(),
        ])
    ).inSingletonScope();

    // ── Socket Server ─────────────────────────────────────────────────────────
    container.bind(TOKENS.SocketServer).toDynamicValue(async (ctx) =>
        new SocketServer(await ctx.container.getAsync(TOKENS.LogDbService))
    ).inSingletonScope();

    // ── TextDocumentSocketService ─────────────────────────────────────────────
    // initialize() is awaited inline. TextDocumentResolver depends on this, so it must resolve first.
    // The container handles that ordering automatically when TextDocumentResolver is requested.
    container.bind(TOKENS.TextDocumentSocketService).toDynamicValue(async (ctx) => {
        const svc = new TextDocumentSocketService(
            await ctx.container.getAsync(TOKENS.SocketServer),
            await ctx.container.getAsync(TOKENS.ChatDocumentDbService),
            await ctx.container.getAsync(TOKENS.ProjectDbService),
        );
        await svc.initialize();
        return svc;
    }).inSingletonScope();

    // ── TextDocumentResolver ──────────────────────────────────────────────────
    // Receives a fully-initialized TextDocumentSocketService via constructor — no post-hoc property assignment needed.
    container.bind(TOKENS.TextDocumentResolver).toDynamicValue(async (ctx) =>
        new TextDocumentResolver(
            await ctx.container.getAsync(TOKENS.TextDocumentSocketService),
        )
    ).inSingletonScope();

    // ── Chat-Room Saver ───────────────────────────────────────────────────────
    container.bind(TOKENS.ChatRoomSaverService).toDynamicValue(async (ctx) =>
        new ChatRoomSaverService(
            await ctx.container.getAsync(TOKENS.ChatRoomDbService),
            await ctx.container.getAsync(TOKENS.ChatJobDbService),
            await ctx.container.getAsync(TOKENS.AgentDbService),
            await ctx.container.getAsync(TOKENS.ProjectDbService),
        )
    ).inSingletonScope();

    // ── Job Hydrator ──────────────────────────────────────────────────────────
    container.bind(TOKENS.JobHydrator).toDynamicValue(async (ctx) =>
        new JobHydrator(
            await ctx.container.getAsync(TOKENS.ChatRoomDbService),
            await ctx.container.getAsync(TOKENS.AppPluginResolver),
            await ctx.container.getAsync(TOKENS.ChatJobDbService),
        )
    ).inSingletonScope();

    // ── Document Resolution ───────────────────────────────────────────────────
    container.bind(TOKENS.ChatDocumentResolutionService).toDynamicValue(async (ctx) =>
        new ChatDocumentResolutionService(
            // TextDocumentResolver is the only document resolver currently; add others here as they are created.
            [await ctx.container.getAsync(TOKENS.TextDocumentResolver)],
            await ctx.container.getAsync(TOKENS.ChatDocumentDbService),
        )
    ).inSingletonScope();

    // ── Agent Service Factory ─────────────────────────────────────────────────
    container.bind(TOKENS.AgentServiceFactory).toDynamicValue(async (ctx) =>
        new AgentServiceFactory(
            await ctx.container.getAsync(TOKENS.ModelServiceResolver),
            await ctx.container.getAsync(TOKENS.AppPluginResolver),
            await ctx.container.getAsync(TOKENS.AgentDbService),
            await ctx.container.getAsync(TOKENS.AgentInstanceDbService),
        )
    ).inSingletonScope();

    // ── Chat Room Hydrator ────────────────────────────────────────────────────
    container.bind(TOKENS.ChatRoomHydratorService).toDynamicValue(async (ctx) =>
        new ChatRoomHydratorService(
            await ctx.container.getAsync(TOKENS.AgentServiceFactory),
            await ctx.container.getAsync(TOKENS.ChatRoomDbService),
            await ctx.container.getAsync(TOKENS.AppPluginResolver),
            await ctx.container.getAsync(TOKENS.JobHydrator),
            await ctx.container.getAsync(TOKENS.AgentDbService),
            await ctx.container.getAsync(TOKENS.AgentInstanceDbService),
            await ctx.container.getAsync(TOKENS.ProjectDbService),
            await ctx.container.getAsync(TOKENS.ChatDocumentResolutionService),
            await ctx.container.getAsync(TOKENS.ChatRoomSaverService),
        )
    ).inSingletonScope();

    // ── Plugin Type Resolvers (multi-bind) ────────────────────────────────────
    // Stateless resolvers are bound as constant values — no container lookups needed at construction.
    container.bind<IPluginTypeResolver<any>>(TOKENS.PluginTypeResolvers).toConstantValue(new RoomInfoPluginResolver());
    container.bind<IPluginTypeResolver<any>>(TOKENS.PluginTypeResolvers).toConstantValue(new ActDrunkPluginResolver());
    container.bind<IPluginTypeResolver<any>>(TOKENS.PluginTypeResolvers).toConstantValue(new OtherAgentsInvisiblePluginResolver());
    container.bind<IPluginTypeResolver<any>>(TOKENS.PluginTypeResolvers).toConstantValue(new DebugPluginResolver());
    container.bind<IPluginTypeResolver<any>>(TOKENS.PluginTypeResolvers).toConstantValue(new OtherAgentMessagesAsUserPluginResolver());
    container.bind<IPluginTypeResolver<any>>(TOKENS.PluginTypeResolvers).toConstantValue(new UserMessagesIgnoredPluginResolver());
    container.bind<IPluginTypeResolver<any>>(TOKENS.PluginTypeResolvers).toConstantValue(new LabelAgentSpeakersPluginResolver());
    container.bind<IPluginTypeResolver<any>>(TOKENS.PluginTypeResolvers).toConstantValue(new IgnoreSpecificAgentPluginResolver());
    container.bind<IPluginTypeResolver<any>>(TOKENS.PluginTypeResolvers).toConstantValue(new RandomChoicePluginResolver());
    container.bind<IPluginTypeResolver<any>>(TOKENS.PluginTypeResolvers).toConstantValue(new CurrentTimeAndDatePluginResolver());
    container.bind<IPluginTypeResolver<any>>(TOKENS.PluginTypeResolvers).toConstantValue(new ArithmeticPluginResolver());
    container.bind<IPluginTypeResolver<any>>(TOKENS.PluginTypeResolvers).toConstantValue(new ShortenedChatHistoryPluginResolver());
    container.bind<IPluginTypeResolver<any>>(TOKENS.PluginTypeResolvers).toConstantValue(new HideMessagesFromOtherAgentsPluginResolver());
    container.bind<IPluginTypeResolver<any>>(TOKENS.PluginTypeResolvers).toConstantValue(new PromptToolCallingPluginResolver());

    // Stateful resolvers that need services from the container:
    container.bind<IPluginTypeResolver<any>>(TOKENS.PluginTypeResolvers).toDynamicValue(async (ctx) =>
        new WebSearchPluginResolver(config.tavilyConfiguration.apiKey)
    ).inSingletonScope();

    container.bind<IPluginTypeResolver<any>>(TOKENS.PluginTypeResolvers).toDynamicValue(async (ctx) =>
        new LabeledMemoryPluginResolver(
            await ctx.container.getAsync(TOKENS.MongoHelper),
            await ctx.container.getAsync(TOKENS.ModelServiceResolver),
        )
    ).inSingletonScope();

    container.bind<IPluginTypeResolver<any>>(TOKENS.PluginTypeResolvers).toDynamicValue(async (ctx) =>
        new LabeledMemory2PluginResolver(
            await ctx.container.getAsync(TOKENS.MongoHelper),
            await ctx.container.getAsync(TOKENS.ModelServiceResolver),
        )
    ).inSingletonScope();

    container.bind<IPluginTypeResolver<any>>(TOKENS.PluginTypeResolvers).toDynamicValue(async (ctx) =>
        new CreateTextDocumentsPluginResolver(
            await ctx.container.getAsync(TOKENS.ChatDocumentDbService),
        )
    ).inSingletonScope();

    container.bind<IPluginTypeResolver<any>>(TOKENS.PluginTypeResolvers).toDynamicValue(async (ctx) =>
        new ManageDocumentFolderPluginResolver(
            await ctx.container.getAsync(TOKENS.ChatDocumentDbService),
            await ctx.container.getAsync(TOKENS.TextDocumentResolver),
        )
    ).inSingletonScope();

    container.bind<IPluginTypeResolver<any>>(TOKENS.PluginTypeResolvers).toDynamicValue(async (ctx) =>
        new InnerVoicePluginResolver(
            await ctx.container.getAsync(TOKENS.ModelServiceResolver),
        )
    ).inSingletonScope();

    // SubAgentPluginResolver receives ChattingService directly — the container resolves ChattingService
    // before this resolver is first used, so there is no circular dependency at resolution time.
    // ChattingService depends on ChatRoomSocketServer; ChatRoomSocketServer does NOT depend on ChattingService,
    // so the graph is acyclic and the container resolves it in the correct order.
    container.bind<IPluginTypeResolver<any>>(TOKENS.PluginTypeResolvers).toDynamicValue(async (ctx) => {
        const chatCoreService = await ctx.container.getAsync<ChatCoreService>(TOKENS.ChatCoreService);
        return new SubAgentPluginResolver(
            // ChattingService is resolved once here; inSingletonScope means the same instance is returned.
            () => ctx.container.get<ChattingService>(TOKENS.ChattingService),
            chatCoreService.chatRoomDbService,
            chatCoreService.agentDbService,
            chatCoreService.agentInstanceDbService,
            chatCoreService,
            await ctx.container.getAsync(TOKENS.AuthDbService),
        );
    }).inSingletonScope();

    // ── AppPluginResolver ─────────────────────────────────────────────────────
    // getAllAsync collects every binding registered under TOKENS.PluginTypeResolvers.
    // Important: AppPluginResolver must be bound AFTER all PluginTypeResolver bindings above.
    container.bind(TOKENS.AppPluginResolver).toDynamicValue(async (ctx) =>
        new AppPluginResolver(
            await ctx.container.getAllAsync<IPluginTypeResolver<any>>(TOKENS.PluginTypeResolvers),
        )
    ).inSingletonScope();

    // ── ChatRoomSocketServer ──────────────────────────────────────────────────
    // initialize() is awaited inline. Must complete before ChattingService is built,
    // since ChattingService holds a reference to ChatRoomSocketServer for broadcasting.
    container.bind(TOKENS.ChatRoomSocketServer).toDynamicValue(async (ctx) => {
        const svc = new ChatRoomSocketServer(
            await ctx.container.getAsync(TOKENS.SocketServer),
            await ctx.container.getAsync(TOKENS.ChatRoomDbService),
            await ctx.container.getAsync(TOKENS.AgentServiceFactory),
            await ctx.container.getAsync(TOKENS.AppPluginResolver),
            await ctx.container.getAsync(TOKENS.JobHydrator),
            await ctx.container.getAsync(TOKENS.AgentDbService),
        );
        await svc.initialize();
        return svc;
    }).inSingletonScope();

    // ── ChattingService ───────────────────────────────────────────────────────
    // Depends on ChatRoomSocketServer (resolved above). SubAgentPluginResolver accesses
    // ChattingService via () => container.get(...) so it does not create a construction cycle.
    container.bind(TOKENS.ChattingService).toDynamicValue(async (ctx) =>
        new ChattingService(
            await ctx.container.getAsync(TOKENS.AgentServiceFactory),
            await ctx.container.getAsync(TOKENS.ChatRoomDbService),
            await ctx.container.getAsync(TOKENS.AppPluginResolver),
            await ctx.container.getAsync(TOKENS.JobHydrator),
            await ctx.container.getAsync(TOKENS.AgentDbService),
            await ctx.container.getAsync(TOKENS.AuthDbService),
            await ctx.container.getAsync(TOKENS.ChatRoomSocketServer),
            await ctx.container.getAsync(TOKENS.AgentInstanceDbService),
            await ctx.container.getAsync(TOKENS.ChatRoomHydratorService),
        )
    ).inSingletonScope();

    // ── VoiceChatService ──────────────────────────────────────────────────────
    // HumeVoiceChatService is bound separately so the voice-chat route can access listVoices() directly.
    // The binding is always present; the value is null when humeCredentials are absent.
    container.bind<HumeVoiceChatService | null>(TOKENS.HumeVoiceChatService).toDynamicValue(async (): Promise<HumeVoiceChatService | null> => {
        return config.humeCredentials ? new HumeVoiceChatService(config) : null;
    }).inSingletonScope();

    container.bind(TOKENS.VoiceChatProviders).toDynamicValue(async (ctx): Promise<IVoiceChatProvider<any>[]> => {
        const providers: IVoiceChatProvider<any>[] = [];
        const hume = await ctx.container.getAsync<HumeVoiceChatService | null>(TOKENS.HumeVoiceChatService);
        if (hume) providers.push(hume);
        if (config.openAiConfig) providers.push(new OpenAiVoiceChatService(config));
        return providers;
    }).inSingletonScope();

    container.bind(TOKENS.VoiceChatService).toDynamicValue(async (ctx) =>
        new VoiceChatService(
            config,
            await ctx.container.getAsync(TOKENS.VoiceChatProviders),
            await ctx.container.getAsync(TOKENS.VoiceFileReferenceDbService),
            await ctx.container.getAsync(TOKENS.AwsS3BucketService),
            await ctx.container.getAsync(TOKENS.ChatRoomDbService),
            await ctx.container.getAsync(TOKENS.AgentDbService),
            await ctx.container.getAsync(TOKENS.AgentInstanceDbService),
            await ctx.container.getAsync(TOKENS.ChatRoomSocketServer),
            await ctx.container.getAsync(TOKENS.ModelServiceResolver),
        )
    ).inSingletonScope();

    return container;
}
