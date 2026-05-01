import express, { Application, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { Container } from 'inversify';
import { TOKENS } from './tokens';
import { bodyObjectIdsToStringMiddleware } from './server/middleware/body-object-ids-to-string.middleware';
import { bodyStringsToObjectIdsMiddleware } from './server/middleware/body-strings-to-object-ids.middleware';
import { getAppConfig } from './config';
import { authMiddleware } from './auth/auth-middleware';
import { bodyStringsToDatesMiddleware } from './server/middleware/string-to-date-converters.middleware';
import { LogDbService } from './database/log-db.service';
import { AuthenticatedSpecialRequest } from './model/authenticated-request.model';
import { adminRouter } from './server/admin/admin.server';

// Route factory imports
import { createAuthRouter } from './server/auth.server';
import { createProjectRouter } from './server/project.server';
import { createAgentConfigsRouter } from './server/agent-configs.server';
import { createJobsRouter } from './server/jobs.server';
import { createChatRoomsRouter } from './server/chat-rooms.server';
import { createAgentInstanceRouter } from './server/agent-instances.server';
import { createChattingRouter } from './server/chatting.server';
import { createChatDocumentsRouter } from './server/chat-documents.server';
import { createOllamaModelConfigRouter } from './server/ollama-model-config.server';
import { createVoiceChatRouter } from './server/voice-chat.server';

// Service types for container resolution
import { AuthDbService } from './database/auth-db.service';
import { ProjectDbService } from './database/chat-core/project-db.service';
import { AgentDbService } from './database/chat-core/agent-db.service';
import { ChatCloningService } from './chat-core/cloning/chat-cloning.service';
import { ChatJobDbService } from './database/chat-core/chat-job-db.service';
import { ChatRoomDbService } from './database/chat-core/chat-room-db.service';
import { AgentInstanceDbService } from './database/chat-core/agent-instance-db.service';
import { ChatDocumentDbService } from './database/chat-core/chat-document-db.service';
import { OllamaModelConfigurationDbService } from './database/chat-core/ollama-configurations-db.service';
import { ChatCoreService } from './services/chat-core.service';
import { ChatRoomHydratorService } from './chat-core/chat-room/chat-room-hydrator.service';
import { ChatDocumentResolutionService } from './chat-core/document/document-resolution.service';
import { ChattingService } from './chat-core/chatting/chatting.service';
import { VoiceChatService } from './services/voice-chat-services/voice-chat.service';
import { HumeVoiceChatService } from './services/voice-chat-services/hume-voice-chat.service';

/** Initializes all routes and middleware for an express app using services from the DI container. */
export async function initializeExpressApp(container: Container): Promise<Application> {
    const app = express();

    await setupCors(app);

    app.use(bodyParser.json());
    app.use(bodyStringsToObjectIdsMiddleware);
    app.use(bodyObjectIdsToStringMiddleware);
    app.use(bodyStringsToDatesMiddleware);

    const loggingService = await container.getAsync<LogDbService>(TOKENS.LogDbService);

    app.use(async (req, _res, next) => {
        try {
            if (!(req.headers['authorization'] as string || req.headers['Authorization'])) {
                await loggingService.logMessage({
                    level: 'info',
                    message: `API Call: ${req.path}`,
                    data: {
                        body: req?.body,
                        path: req.path,
                        hasAuthToken: false,
                        userIp: req.ip,
                        hostName: req.hostname,
                    }
                });
            }
        } catch (err) { }
        next();
    });

    // Resolve services from container for route factories
    const authDbService = await container.getAsync<AuthDbService>(TOKENS.AuthDbService);
    const projectDbService = await container.getAsync<ProjectDbService>(TOKENS.ProjectDbService);
    const agentDbService = await container.getAsync<AgentDbService>(TOKENS.AgentDbService);
    const chatCloningService = await container.getAsync<ChatCloningService>(TOKENS.ChatCloningService);
    const chatJobDbService = await container.getAsync<ChatJobDbService>(TOKENS.ChatJobDbService);
    const chatRoomDbService = await container.getAsync<ChatRoomDbService>(TOKENS.ChatRoomDbService);
    const agentInstanceDbService = await container.getAsync<AgentInstanceDbService>(TOKENS.AgentInstanceDbService);
    const chatDocumentDbService = await container.getAsync<ChatDocumentDbService>(TOKENS.ChatDocumentDbService);
    const ollamaModelConfigDbService = await container.getAsync<OllamaModelConfigurationDbService>(TOKENS.OllamaModelConfigDbService);
    const chatCoreService = await container.getAsync<ChatCoreService>(TOKENS.ChatCoreService);
    const chatRoomHydratorService = await container.getAsync<ChatRoomHydratorService>(TOKENS.ChatRoomHydratorService);
    const documentResolver = await container.getAsync<ChatDocumentResolutionService>(TOKENS.ChatDocumentResolutionService);
    const chattingService = await container.getAsync<ChattingService>(TOKENS.ChattingService);
    const voiceChatService = await container.getAsync<VoiceChatService>(TOKENS.VoiceChatService);
    const humeVoiceChatService = await container.getAsync<HumeVoiceChatService | null>(TOKENS.HumeVoiceChatService);

    // Auth routes are before authMiddleware — they don't require a valid token
    app.use(createAuthRouter(authDbService));

    app.use(authMiddleware);

    app.use(async (req, _res, next) => {
        try {
            if (req.headers['authorization'] as string || req.headers['Authorization']) {
                const userRequest = req as AuthenticatedSpecialRequest<typeof req>;

                await loggingService.logMessage({
                    level: 'info',
                    message: `API Call: ${req.path}`,
                    data: {
                        body: req?.body,
                        path: req.path,
                        user: userRequest.user,
                        userIp: req.ip,
                        hostName: req.hostname,
                        hasAuthToken: true
                    }
                });
            }
        } catch (err) { }
        next();
    });

    app.use('/admin', adminRouter);
    app.use(createProjectRouter(projectDbService, chatCoreService));
    app.use(createAgentConfigsRouter(agentDbService, projectDbService, chatCloningService));
    app.use(createJobsRouter(projectDbService, chatJobDbService, chatCloningService));
    app.use(createChatRoomsRouter(chatRoomDbService, chatJobDbService, projectDbService, chatCoreService, chatRoomHydratorService));
    app.use(createAgentInstanceRouter(agentInstanceDbService, chatRoomDbService, chatCoreService));
    app.use(createChattingRouter(chattingService));
    app.use(createChatDocumentsRouter(projectDbService, chatDocumentDbService, documentResolver));
    app.use(createOllamaModelConfigRouter(authDbService, ollamaModelConfigDbService));
    app.use(createVoiceChatRouter(authDbService, chatRoomDbService, voiceChatService, humeVoiceChatService));

    app.use((_req, res) => {
        res.status(404).send('Not Found');
    });

    // Global error handler — must have 4 arguments for Express to treat it as an error handler.
    app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
        const message = err instanceof Error ? err.message : 'Internal server error';
        console.error(`Unhandled error on ${req.method} ${req.path}:`, err);
        loggingService.logMessage({ level: 'error', message: `Unhandled error: ${message}`, data: { path: req.path, method: req.method } }).catch(() => { });
        if (!res.headersSent) {
            res.status(500).json({ message: 'Internal server error' });
        }
    });

    return app;
}

/** Applies CORS to the app. */
async function setupCors(app: Application) {
    const config = await getAppConfig();

    if (!config.corsAllowed) {
        return;
    }

    const configurations = config.corsAllowed.map(cfg => {
        return {
            origin: cfg,
            methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
            credentials: true,
        };
    });

    for (let cfg of configurations) {
        console.log(`Setting up CORS for: ${cfg.origin}`);
        app.use(cors(cfg));
    }
}
