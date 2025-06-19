import { MongoClient, Document, ObjectId } from "mongodb";
import * as mongo from 'mongodb';
import { UpsertDbItem } from "./model/shared-models/db-operation-types.model";
import { PaginatedResult } from "./model/shared-models/paginated-result.model";
import { getPaginatedPipelineEnding, unpackPaginatedResults } from "./database/db-utils";
import { nullToUndefined } from "./utils/empty-and-null.utils";

// const defaultConnectionString = 'mongodb://192.168.99.100:27017'
// const defaultConnectionString = 'mongodb://localhost:27017'
const defaultConnectionString = 'mongodb://mongo.fingercraft.run:27017';

type PropertyMapping<T, K> = { [n in keyof T]: K; };
type ProjectionMap<T, P extends PropertyMapping<T, 1>> = { [k in keyof P & keyof T]: T[k] };

export class MongoHelper {
    constructor(private connectionString?: string, private readonly databaseName: string = 'chat-session-db') {
        if (!connectionString) {
            this.connectionString = defaultConnectionString;
        }
    }

    private client?: MongoClient;
    private db?: mongo.Db;

    /** Boolean value indicating that the close() method was called, and
     *   a reconnect should not be attempted. */
    private intentionalClose = false;

    /** Initializes the database connection. */
    async connect(): Promise<void> {
        // We cannot connect, if we're already connected.
        if (this.client) {
            try {
                this.client.close();
            } catch (err) {

            }
            this.db = undefined;
            this.client = undefined;
            throw new Error('Cannot reconnect to the database if it is already connected.');
        }

        this.client = await MongoClient.connect(this.connectionString!);
        this.db = this.client.db(this.databaseName);

        const reconnectHandler = () => {
            if (this.intentionalClose) {
                console.log(`MongoDB closed connection intentionally.  A reconnect will not be attempted.`);
                return;
            }

            console.log(`MongoDB connection closed.  Attempting to reconnect.`);

            // Remove this handler, since we'll be adding it again later.
            this.client!.removeListener('close', reconnectHandler);

            // Clear up our current properties.
            this.db = undefined;
            this.client = undefined;
            this.intentionalClose = false;

            // Attempt to reconnect.
            this.connect();
        };
        this.client.addListener('close', reconnectHandler);
    }

    /** Closes the connection to the database. */
    async disconnect(): Promise<void> {
        this.intentionalClose = true;

        if (this.client) {
            await this.client.close();
            this.db = undefined;
            this.client = undefined;
        }
    }

    get isConnected(): boolean {
        return !!this.db;
    }

    async makeCall<T>(callback: (db: mongo.Db) => Promise<T>): Promise<T> {
        let makeConnection = !this.isConnected;
        if (makeConnection) {
            await this.connect();
        }

        try {
            return await callback(this.db!) as T;
        } finally {
            if (makeConnection) {
                await this.disconnect();
            }
        }
    }


    async makeCallWithCollection<RET_TYPE, COL_TYPE extends Document = Document>(collectionName: string, callback: (db: mongo.Db, collection: mongo.Collection<COL_TYPE>) => Promise<RET_TYPE>): Promise<RET_TYPE> {
        let makeConnection = !this.isConnected;
        if (makeConnection) {
            await this.connect();
        }

        try {
            // Get the collection.
            const collection = this.db!.collection<COL_TYPE>(collectionName);

            // Return the result from the callback.
            return await callback(this.db!, collection) as RET_TYPE;
        } finally {
            if (makeConnection) {
                await this.disconnect();
            }
        }
    }

    async updateDataItems<T extends Document = Document, Q extends Partial<Document> = Partial<T>>(collectionName: string, matchQuery: Q, update: Partial<T>, config?: { updateOne: boolean; }): Promise<number> {
        return await this.makeCallWithCollection<number, T>(collectionName, async (db, col) => {
            if (config?.updateOne !== false) {
                // Perform the single update.
                const result = await col.updateOne(matchQuery, { $set: update });
                return result.modifiedCount;
            } else {
                // Perform the mass update.
                const result = await col.updateMany(matchQuery, { $set: update });
                return result.modifiedCount;
            }
        });
    }

    async deleteDataItems<COL_TYPE extends Document, Q_TYPE extends Document = Partial<COL_TYPE>>(collectionName: string, matchQuery: Q_TYPE, config?: { deleteMany: boolean; }): Promise<number> {
        return await this.makeCallWithCollection<number, COL_TYPE>(collectionName, async (_, col) => {
            if (config?.deleteMany === true) {
                // Perform the mass update.
                const result = await col.deleteMany(matchQuery);
                return result.deletedCount;
            } else {
                // Perform the single update.
                const result = await col.deleteOne(matchQuery);
                return result.deletedCount;
            }
        });
    }

    async findDataItem<C extends Document, T extends Document = Partial<C>>(collectionName: string, query: T): Promise<C[]>;
    async findDataItem<C extends Document, T extends Document = Partial<C>>(collectionName: string, query: T, config: { findOne: false, skip?: number, limit?: number; }): Promise<C[]>;
    async findDataItem<C extends Document, T extends Document = Partial<C>>(collectionName: string, query: T, config: { findOne: true; }): Promise<C | undefined>;
    async findDataItem<C extends Document, T extends Document = Partial<C>>(collectionName: string, query: T, config?: { findOne: boolean, skip?: number, limit?: number; }): Promise<C | C[] | undefined> {
        return await this.makeCallWithCollection<C[] | C | undefined, T>(collectionName, async (db, col) => {
            if (config?.findOne === true) {
                return nullToUndefined(await col.findOne<C>(query));
            } else {
                // Add the skip and limit clauses, if required.
                let findQuery: { skip?: number, limit?: number; } | undefined = undefined;
                if (config?.skip || config?.limit) {
                    findQuery = {};
                    if (config.skip) {
                        findQuery.skip = config.skip;
                    }
                    if (config.limit) {
                        findQuery.limit = config.limit;
                    }
                }

                return await col.find<C>(query, findQuery).toArray();
            }
        });
    }


    async findDataItemWithProjection<C extends Document, P extends PropertyMapping<Partial<C>, 1> = PropertyMapping<Partial<C>, 1>, T extends Document = Partial<C>>(collectionName: string, query: T, projection: P): Promise<C[]>;
    async findDataItemWithProjection<C extends Document, P extends PropertyMapping<Partial<C>, 1> = PropertyMapping<Partial<C>, 1>, T extends Document = Partial<C>>(collectionName: string, query: T, projection: P, config: { findOne: false; }): Promise<C[]>;
    async findDataItemWithProjection<C extends Document, P extends PropertyMapping<Partial<C>, 1> = PropertyMapping<Partial<C>, 1>, T extends Document = Partial<C>>(collectionName: string, query: T, projection: P, config: { findOne: true; }): Promise<C | undefined>;
    async findDataItemWithProjection<C extends Document, P extends PropertyMapping<Partial<C>, 1> = PropertyMapping<Partial<C>, 1>, T extends Document = Partial<C>>(collectionName: string, query: T, projection: P, config?: { findOne: boolean; }): Promise<C | C[] | undefined> {
        return await this.makeCallWithCollection<C[] | C | undefined, T>(collectionName, async (db, col) => {
            if (config?.findOne === true) {
                return nullToUndefined(await col.findOne<C>(query, { projection }));
            } else {
                return await col.find<C>(query, { projection }).toArray();
            }
        });
    }

    async upsertDataItem<T extends Document & { _id: ObjectId; }>(collectionName: string, targetEntity: UpsertDbItem<T>): Promise<T> {
        return await this.makeCallWithCollection<T>(collectionName, async (db, col) => {
            if (!targetEntity._id) {
                const result = await col.insertOne(targetEntity);
                targetEntity._id = result.insertedId;
                return targetEntity as T;

            } else {
                await col.updateOne({ _id: targetEntity._id }, { $set: targetEntity });
                return targetEntity as T;

            }
        });
    }

    async getPaginatedPipelineResult<RET_TYPE extends Document, COL_TYPE extends Document = RET_TYPE>(collectionName: string, pipeLineAggregation: object[], skip: number, limit: number): Promise<PaginatedResult<RET_TYPE>> {
        return await this.makeCallWithCollection<PaginatedResult<RET_TYPE>, COL_TYPE>(collectionName, async (db, collection) => {
            // Create the aggregation to get this information.
            const aggregation = [
                ...pipeLineAggregation,
                // Place pipeline here
                ...getPaginatedPipelineEnding(skip, limit)
            ];
            // Unpack the pipeline result to get the paginated results.
            const result = unpackPaginatedResults<RET_TYPE>(await collection.aggregate(aggregation).toArray());
            // Return the paginated results.
            return result;
        });
    }

    async getPipelineResult<RET_TYPE extends Document, COL_TYPE extends Document = RET_TYPE>(collectionName: string, pipeLineAggregation: object[]): Promise<PaginatedResult<RET_TYPE>> {
        return await this.makeCallWithCollection<PaginatedResult<RET_TYPE>, COL_TYPE>(collectionName, async (db, collection) => {
            // Unpack the pipeline result to get the paginated results.
            const result = unpackPaginatedResults<RET_TYPE>(await collection.aggregate(pipeLineAggregation).toArray());
            // Return the paginated results.
            return result;
        });
    }
}
