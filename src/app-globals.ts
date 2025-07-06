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
/** If we were using dependency injection, this would be the DI services we'd inject in the necessary places. */

/** The mongo helper used in all DB Services. */
export let dbHelper: MongoHelper;
export let authDbService: AuthDbService;
export let loggingService: LogDbService;
export let chatDbService: ChatJobDbService;
export let chatRoomDbService: ChatRoomDbService;
export let projectDbService: ProjectDbService;
export let agentDbService: AgentDbService;

/* App Services. */
export let authService: AuthService;

/** Initializes the services used in the application. */
export async function initializeServices(): Promise<void> {
    // Load the configuration.
    const config = await getAppConfig();

    /** The mongo helper used in all DB Services. */
    dbHelper = new MongoHelper(config.mongo.connectionString, config.mongo.databaseName);
    await dbHelper.connect();

    /* All DB Services. */
    loggingService = new LogDbService(dbHelper);
    chatDbService = new ChatJobDbService(dbHelper);
    chatRoomDbService = new ChatRoomDbService(dbHelper);
    authDbService = new AuthDbService(dbHelper);
    projectDbService = new ProjectDbService(dbHelper);
    agentDbService = new AgentDbService(dbHelper);

    /* App Services. */
    authService = new AuthService(authDbService, loggingService);

}