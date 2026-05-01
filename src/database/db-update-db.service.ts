import { injectable } from 'inversify';
import { MongoHelper } from "../mongo-helper";
import { DbService } from "./db-service";
import { DatabaseUpdateInfo } from "../model/database-update-info.model";
import { DbCollectionNames } from "../model/db-collection-names.constants";

/**
 * Service used to insert and query executed database update records.
 */
@injectable()
export class DbUpdateServiceDb extends DbService {
    constructor(dbHelper: MongoHelper) {
        super(dbHelper);
    }

    /**
     * Inserts a new database update record by name.
     * If a record with the specified name already exists it will not be duplicated and the existing record is returned.
     * @param name Unique name of the database update.
     */
    async insertIfNotExists(name: string): Promise<DatabaseUpdateInfo> {
        // Check if the record already exists.
        const existing = await this.dbHelper.findDataItem<DatabaseUpdateInfo>(DbCollectionNames.DatabaseUpdates, { name }, { findOne: true });
        if (existing) {
            return existing;
        }

        // Create the new record.
        const newRecord: DatabaseUpdateInfo = {
            name,
            dateExecuted: new Date()
        };

        // Insert and return the inserted result with the new _id.
        return await this.dbHelper.makeCallWithCollection<DatabaseUpdateInfo>(DbCollectionNames.DatabaseUpdates, async (_db, col) => {
            const result = await col.insertOne(newRecord as any);
            return { ...newRecord, _id: result.insertedId } as DatabaseUpdateInfo;
        });
    }

    /**
     * Gets a database update record by its unique name.
     * @param name Name of the update.
     */
    async getByName(name: string): Promise<DatabaseUpdateInfo | undefined> {
        return await this.dbHelper.findDataItem<DatabaseUpdateInfo>(DbCollectionNames.DatabaseUpdates, { name }, { findOne: true });
    }

    /**
     * Returns a boolean indicating whether a database update with the specified name has been executed.
     * @param name Name of the update.
     */
    async hasExecuted(name: string): Promise<boolean> {
        const existing = await this.getByName(name);
        return !!existing;
    }

    /**
     * Returns all database update records.
     */
    async getAll(): Promise<DatabaseUpdateInfo[]> {
        return await this.dbHelper.findDataItem<DatabaseUpdateInfo>(DbCollectionNames.DatabaseUpdates, {});
    }
}
