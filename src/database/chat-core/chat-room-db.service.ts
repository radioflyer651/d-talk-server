import { MongoHelper } from "../../mongo-helper";
import { DbService } from "../db-service";
import { ChatRoomData } from "../../model/shared-models/chat-core/chat-room-data.model";
import { ObjectId } from "mongodb";
import { UpsertDbItem, isNewDbItem } from "../../model/shared-models/db-operation-types.model";
import { DbCollectionNames } from "../../model/db-collection-names.constants";

export class ChatRoomDbService extends DbService {
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

    /**
     * Add a new log message to the logs array of a chat room by its ObjectId.
     * The log message can be any object (e.g., { message: string, timestamp: Date, ... }).
     */
    async addChatRoomLog(roomId: ObjectId, log: object): Promise<number> {
        // Fallback: Read, update, and write back the logs array if no raw update is available
        const chatRoom = await this.getChatRoomById(roomId);

        if (!chatRoom) {
            throw new Error(`No room exists with the ID: ${roomId}`);
        }

        const updatedLogs = [...(chatRoom.logs || []), log];
        return await this.dbHelper.updateDataItems<ChatRoomData>(
            DbCollectionNames.ChatRooms,
            { _id: roomId },
            { logs: updatedLogs },
            { updateOne: true }
        );
    }
}