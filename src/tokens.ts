/** Injection tokens for the Inversify container.
 *  Every injectable service has a corresponding Symbol here.
 *  Route factory functions receive typed service instances — they never import from this file directly. */
export const TOKENS = {
    // ── Config ──────────────────────────────────────────────────────────────
    AppConfig:                      Symbol('AppConfig'),

    // ── Infrastructure ───────────────────────────────────────────────────────
    MongoHelper:                    Symbol('MongoHelper'),

    // ── DB Services ──────────────────────────────────────────────────────────
    LogDbService:                   Symbol('LogDbService'),
    AuthDbService:                  Symbol('AuthDbService'),
    ProjectDbService:               Symbol('ProjectDbService'),
    AgentDbService:                 Symbol('AgentDbService'),
    ChatJobDbService:               Symbol('ChatJobDbService'),
    ChatRoomDbService:              Symbol('ChatRoomDbService'),
    AgentInstanceDbService:         Symbol('AgentInstanceDbService'),
    ChatDocumentDbService:          Symbol('ChatDocumentDbService'),
    OllamaModelConfigDbService:     Symbol('OllamaModelConfigDbService'),
    VoiceFileReferenceDbService:    Symbol('VoiceFileReferenceDbService'),
    DbUpdateDbService:              Symbol('DbUpdateDbService'),

    // ── App Services ─────────────────────────────────────────────────────────
    AuthService:                    Symbol('AuthService'),
    AwsS3BucketService:             Symbol('AwsS3BucketService'),
    ChatCoreService:                Symbol('ChatCoreService'),

    // ── Chat-Core ────────────────────────────────────────────────────────────
    ModelServiceResolver:           Symbol('ModelServiceResolver'),
    /** Bound as IPluginResolver */
    AppPluginResolver:              Symbol('AppPluginResolver'),
    /** Multi-inject: all IPluginTypeResolver instances are bound under this token */
    PluginTypeResolvers:            Symbol('PluginTypeResolvers'),
    ChatDocumentResolutionService:  Symbol('ChatDocumentResolutionService'),
    AgentServiceFactory:            Symbol('AgentServiceFactory'),
    JobHydrator:                    Symbol('JobHydrator'),
    ChatRoomHydratorService:        Symbol('ChatRoomHydratorService'),
    ChatRoomSaverService:           Symbol('ChatRoomSaverService'),
    ChatCloningService:             Symbol('ChatCloningService'),

    // ── Socket / Real-time ───────────────────────────────────────────────────
    SocketServer:                   Symbol('SocketServer'),
    ChatRoomSocketServer:           Symbol('ChatRoomSocketServer'),
    TextDocumentSocketService:      Symbol('TextDocumentSocketService'),
    /** TextDocumentResolver depends on TextDocumentSocketService — container resolves this automatically */
    TextDocumentResolver:           Symbol('TextDocumentResolver'),
    ChattingService:                Symbol('ChattingService'),
    VoiceChatService:               Symbol('VoiceChatService'),

    // ── Voice Providers ──────────────────────────────────────────────────────
    VoiceChatProviders:             Symbol('VoiceChatProviders'),
    /** Optional: only bound when humeCredentials are present in config */
    HumeVoiceChatService:           Symbol('HumeVoiceChatService'),
};
