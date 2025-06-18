import { DbService } from "./db-service";
import { ObjectId } from "mongodb";
import { DbCollectionNames } from "../model/db-collection-names.constants";
import { User } from "../model/shared-models/user.model";

export type LogLevelTypes = 'error' | 'info' | 'debug' | 'warn';

export interface LogMessage {
    chatId?: ObjectId,
    userId?: ObjectId,
    user?: User,
    category?: string,
    level: LogLevelTypes,
    data?: any,
    message: string;
    dateTime?: Date;
}

/** Provides logging to the MongoDb. */
export class LogDbService extends DbService {

    /** Logs a message to the logging table. */
    async logMessage(message: LogMessage): Promise<void> {
        // Ensure the date/time is set.
        if (!message.dateTime) {
            message.dateTime = new Date();
        }

        await this.dbHelper.makeCallWithCollection(DbCollectionNames.Logs, async (db, collection) => {
            await collection.insertOne(message);
        });
    }
}