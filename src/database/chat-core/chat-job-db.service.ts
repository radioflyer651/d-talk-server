import { MongoHelper } from "../../mongo-helper";
import { DbService } from "../db-service";
import { ObjectId } from "mongodb";
import { UpsertDbItem } from "../../model/shared-models/db-operation-types.model";
import { DbCollectionNames } from "../../model/db-collection-names.constants";
import { ChatJobData } from "../../model/shared-models/chat-core/chat-job-data.model";

export class ChatJobDbService extends DbService {
    constructor(dbHelper: MongoHelper) {
        super(dbHelper);
    }

    /** Create or update a chat job. */
    async upsertChatJob(job: UpsertDbItem<ChatJobData>): Promise<ChatJobData> {
        return await this.dbHelper.upsertDataItem<any>(DbCollectionNames.ChatJobs, job) as ChatJobData;
    }

    /** Get a chat job by its ObjectId. */
    async getChatJobById(jobId: ObjectId): Promise<ChatJobData | undefined> {
        return await this.dbHelper.findDataItem<ChatJobData, { _id: ObjectId; }>(
            DbCollectionNames.ChatJobs,
            { _id: jobId },
            { findOne: true }
        ) as ChatJobData | undefined;
    }

    /** Get all chat jobs for a given agent. */
    async getChatJobsByAgent(agentId: ObjectId): Promise<ChatJobData[]> {
        return await this.dbHelper.findDataItem<ChatJobData, { agentId: ObjectId; }>(
            DbCollectionNames.ChatJobs,
            { agentId }
        ) as ChatJobData[];
    }

    /** Update a chat job by its ObjectId. */
    async updateChatJob(jobId: ObjectId, update: Partial<ChatJobData>): Promise<number> {
        return await this.dbHelper.updateDataItems<ChatJobData>(
            DbCollectionNames.ChatJobs,
            { _id: jobId },
            update,
            { updateOne: true }
        );
    }

    /** Delete a chat job by its ObjectId. */
    async deleteChatJob(jobId: ObjectId): Promise<number> {
        return await this.dbHelper.deleteDataItems<ChatJobData, { _id: ObjectId; }>(
            DbCollectionNames.ChatJobs,
            { _id: jobId },
            { deleteMany: false }
        );
    }
}
