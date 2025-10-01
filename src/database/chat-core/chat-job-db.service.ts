import { MongoHelper } from "../../mongo-helper";
import { DbService } from "../db-service";
import { ObjectId } from "mongodb";
import { UpsertDbItem } from "../../model/shared-models/db-operation-types.model";
import { DbCollectionNames } from "../../model/db-collection-names.constants";
import { ChatJobConfiguration } from "../../model/shared-models/chat-core/chat-job-data.model";
import { StoredMessage } from "@langchain/core/messages";
import { PositionableMessage } from "../../model/shared-models/chat-core/positionable-message.model";
import { setMessageDisabledValue } from "../../model/shared-models/chat-core/utils/messages.utils";

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
            { deleteMany: true }
        );
    }

    /** Sets the hideMessages property on a specified ChatJob. */
    async setChatJobMessagesHidden(jobId: ObjectId, messagesHidden: boolean) {
        return await this.dbHelper.updateDataItems<ChatJobConfiguration>(
            DbCollectionNames.ChatJobs,
            { _id: jobId },
            { hideMessages: messagesHidden },
            { updateOne: true }
        );
    }


    /** Given a specified job ID, sets the disabled property of an instruction message's disabled property, given it's index in the instruction list. */
    async setInstructionDisabled(jobId: ObjectId, messageIndex: number, newDisabledValue: boolean) {
        return await this.dbHelper.makeCallWithCollection<undefined, ChatJobConfiguration>(DbCollectionNames.ChatJobs, async (db, collection) => {
            // Get the job data.
            const chatJob = await collection.findOne({ _id: jobId });

            // If not found, then we have problems.
            if (!chatJob) {
                throw new Error(`Agent with the ID ${jobId} does not exist.`);
            }

            // Get the message from the appropriate list.
            let message: PositionableMessage<StoredMessage>;
            message = chatJob.instructions[messageIndex];

            // If not found, then we have problems.
            if (!message) {
                throw new Error(`ChatJob does not have a message with index ${messageIndex} in the instructions list.`);
            }

            // Update the value.
            setMessageDisabledValue(message.message, newDisabledValue);

            // Save the value back.
            await collection.updateOne({ _id: jobId }, { $set: { instructions: chatJob.instructions } });
        });
    }
}
