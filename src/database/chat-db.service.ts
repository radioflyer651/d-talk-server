import { MongoHelper } from "../mongo-helper";
import { DbService } from "./db-service";
import { ChatRoomData } from "../chat-core/agent/chat-room/chat-room-data.model";
import { ObjectId } from "mongodb";
import { UpsertDbItem, isNewDbItem } from "../model/shared-models/db-operation-types.model";
import { DbCollectionNames } from "../model/db-collection-names.constants";
import { AgentInstanceConfiguration } from "../chat-core/agent/model/agent-instance-configuration.model";

export class ChatDbService extends DbService {
    constructor(
        dbHelper: MongoHelper
    ) {
        super(dbHelper);
    }

    /** Create or update a chat room. */
    async upsertChatRoom(room: UpsertDbItem<ChatRoomData>): Promise<ChatRoomData> {
        // The MongoHelper expects _id to be present for updates, and absent for inserts.
        // UpsertDbItem allows _id to be optional, which matches the helper's contract.
        // However, the generic constraint on upsertDataItem requires _id: ObjectId, so we must cast.
        return await this.dbHelper.upsertDataItem<any>(DbCollectionNames.ChatRooms, room) as ChatRoomData;
    }

    /** Get a chat room by its ObjectId. */
    async getChatRoomById(roomId: ObjectId): Promise<ChatRoomData | undefined> {
        return await this.dbHelper.findDataItem<ChatRoomData, { _id: ObjectId; }>(
            DbCollectionNames.ChatRooms,
            { _id: roomId },
            { findOne: true }
        ) as ChatRoomData | undefined;
    }

    /** Get all chat rooms for a user. */
    async getChatRoomsByUser(userId: ObjectId): Promise<ChatRoomData[]> {
        return await this.dbHelper.findDataItem<ChatRoomData, { userId: ObjectId; }>(
            DbCollectionNames.ChatRooms,
            { userId }
        ) as ChatRoomData[];
    }

    /** Update a chat room by its ObjectId. */
    async updateChatRoom(roomId: ObjectId, update: Partial<ChatRoomData>): Promise<number> {
        return await this.dbHelper.updateDataItems<ChatRoomData>(
            DbCollectionNames.ChatRooms,
            { _id: roomId },
            update,
            { updateOne: true }
        );
    }

    /** Delete a chat room by its ObjectId. */
    async deleteChatRoom(roomId: ObjectId): Promise<number> {
        return await this.dbHelper.deleteDataItems<ChatRoomData, { _id: ObjectId; }>(
            DbCollectionNames.ChatRooms,
            { _id: roomId },
            { deleteMany: false }
        );
    }

    /** Update the isBusy property of a chat room by its ObjectId. */
    async setChatRoomBusy(roomId: ObjectId, isBusy: boolean): Promise<number> {
        return await this.dbHelper.updateDataItems<ChatRoomData>(
            DbCollectionNames.ChatRooms,
            { _id: roomId },
            { isBusy },
            { updateOne: true }
        );
    }

    /** Update the conversation property of a chat room by its ObjectId. */
    async updateChatRoomConversation(roomId: ObjectId, conversation: ChatRoomData["conversation"]): Promise<number> {
        return await this.dbHelper.updateDataItems<ChatRoomData>(
            DbCollectionNames.ChatRooms,
            { _id: roomId },
            { conversation },
            { updateOne: true }
        );
    }


    /** Create or update an agent instance. */
    async upsertAgent(agent: UpsertDbItem<AgentInstanceConfiguration>): Promise<AgentInstanceConfiguration> {
        return await this.dbHelper.upsertDataItem<any>(DbCollectionNames.Users, agent) as AgentInstanceConfiguration;
    }

    /** Get an agent instance by its ObjectId. */
    async getAgentById(agentId: ObjectId): Promise<AgentInstanceConfiguration | undefined> {
        return await this.dbHelper.findDataItem<AgentInstanceConfiguration, { _id: ObjectId; }>(
            DbCollectionNames.Users,
            { _id: agentId },
            { findOne: true }
        ) as AgentInstanceConfiguration | undefined;
    }

    /** Get all agent instances for a given identity. */
    async getAgentsByIdentity(identityId: ObjectId): Promise<AgentInstanceConfiguration[]> {
        return await this.dbHelper.findDataItem<AgentInstanceConfiguration, { "identity._id": ObjectId; }>(
            DbCollectionNames.Users,
            { "identity._id": identityId }
        ) as AgentInstanceConfiguration[];
    }

    /** Update an agent instance by its ObjectId. */
    async updateAgent(agentId: ObjectId, update: Partial<AgentInstanceConfiguration>): Promise<number> {
        return await this.dbHelper.updateDataItems<AgentInstanceConfiguration>(
            DbCollectionNames.Users,
            { _id: agentId },
            update,
            { updateOne: true }
        );
    }

    /** Delete an agent instance by its ObjectId. */
    async deleteAgent(agentId: ObjectId): Promise<number> {
        return await this.dbHelper.deleteDataItems<AgentInstanceConfiguration, { _id: ObjectId; }>(
            DbCollectionNames.Users,
            { _id: agentId },
            { deleteMany: false }
        );
    }

    /** Get multiple agent instances by an array of ObjectIds. */
    async getAgentsByIds(agentIds: ObjectId[]): Promise<AgentInstanceConfiguration[]> {
        return await this.dbHelper.findDataItem<AgentInstanceConfiguration, { _id: { $in: ObjectId[] } }>(
            DbCollectionNames.Users,
            { _id: { $in: agentIds } }
        ) as AgentInstanceConfiguration[];
    }
}