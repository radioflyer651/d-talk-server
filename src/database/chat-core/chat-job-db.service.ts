import { MongoHelper } from "../../mongo-helper";
import { DbService } from "../db-service";
import { ObjectId } from "mongodb";
import { UpsertDbItem } from "../../model/shared-models/db-operation-types.model";
import { DbCollectionNames } from "../../model/db-collection-names.constants";
import { ChatJobConfiguration } from "../../model/shared-models/chat-core/chat-job-data.model";

export class ChatJobDbService extends DbService {
    constructor(dbHelper: MongoHelper) {
        super(dbHelper);
    }

    /** Create or update a chat job. */
    async upsertChatJob(job: UpsertDbItem<ChatJobConfiguration>): Promise<ChatJobConfiguration> {
        return await this.dbHelper.upsertDataItem<any>(DbCollectionNames.ChatJobs, job) as ChatJobConfiguration;
    }

    /** Get a chat job by its ObjectId. */
    async getChatJobById(jobId: ObjectId): Promise<ChatJobConfiguration | undefined> {
        return await this.dbHelper.findDataItem<ChatJobConfiguration, { _id: ObjectId; }>(
            DbCollectionNames.ChatJobs,
            { _id: jobId },
            { findOne: true }
        ) as ChatJobConfiguration | undefined;
    }

    /** Get all chat jobs for a given project. */
    async getChatJobsByProject(projectId: ObjectId): Promise<ChatJobConfiguration[]> {
        return await this.dbHelper.findDataItem<ChatJobConfiguration, { projectId: ObjectId; }>(
            DbCollectionNames.ChatJobs,
            { projectId }
        ) as ChatJobConfiguration[];
    }

    /** Update a chat job by its ObjectId. */
    async updateChatJob(jobId: ObjectId, update: Partial<ChatJobConfiguration>): Promise<number> {
        return await this.dbHelper.updateDataItems<ChatJobConfiguration>(
            DbCollectionNames.ChatJobs,
            { _id: jobId },
            update,
            { updateOne: true }
        );
    }

    /** Delete a chat job by its ObjectId. */
    async deleteChatJob(jobId: ObjectId): Promise<number> {
        return await this.dbHelper.deleteDataItems<ChatJobConfiguration, { _id: ObjectId; }>(
            DbCollectionNames.ChatJobs,
            { _id: jobId },
            { deleteMany: false }
        );
    }

    /** Delete a chat job by its ObjectId. */
    async deleteChatJobsByProjectId(projectId: ObjectId): Promise<number> {
        return await this.dbHelper.deleteDataItems<ChatJobConfiguration>(
            DbCollectionNames.ChatJobs,
            { projectId: projectId },
            { deleteMany: false }
        );
    }
}
