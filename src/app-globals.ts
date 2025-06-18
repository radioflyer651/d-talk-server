import { getAppConfig } from "./config";
import { LogDbService } from "./database/log-db.service";
import { MongoHelper } from "./mongo-helper";
import { AuthService } from "./services/auth-service";
/** If we were using dependency injection, this would be the DI services we'd inject in the necessary places. */

/** The mongo helper used in all DB Services. */
export let dbHelper: MongoHelper;
export let loggingService: LogDbService;

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

    /* App Services. */


}