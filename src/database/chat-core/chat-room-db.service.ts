import { MongoHelper } from "../../mongo-helper";
import { DbService } from "../db-service";
import { ChatRoomData } from "../../model/shared-models/chat-core/chat-room-data.model";
import { ObjectId } from "mongodb";
import { UpsertDbItem, isNewDbItem } from "../../model/shared-models/db-operation-types.model";
import { DbCollectionNames } from "../../model/db-collection-names.constants";
import { ChatRoom } from "../../chat-core/chat-room/chat-room.service";
import { MESSAGE_VOICE_CHAT_ID_KEY } from "../../model/shared-models/chat-core/utils/messages.utils";

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

    /** Get all chat rooms for a given project ID. */
    async getChatRoomsByProject(projectId: ObjectId): Promise<ChatRoomData[]> {
        return await this.dbHelper.findDataItem<ChatRoomData, { projectId: ObjectId; }>(
            DbCollectionNames.ChatRooms,
            { projectId }
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

    /** Delete a chat room by its ObjectId. */
    async deleteChatRoomsByProjectId(projectId: ObjectId): Promise<number> {
        return await this.dbHelper.deleteDataItems<ChatRoomData>(
            DbCollectionNames.ChatRooms,
            { projectId: projectId },
            { deleteMany: true }
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

    /** Update the conversation property of a chat room by its ObjectId. */
    async updateChatRoomDocumentPermissions(roomId: ObjectId, chatDocumentReferences: ChatRoomData["chatDocumentReferences"]): Promise<number> {
        return await this.dbHelper.updateDataItems<ChatRoomData>(
            DbCollectionNames.ChatRooms,
            { _id: roomId },
            { chatDocumentReferences },
            { updateOne: true }
        );
    }

    /** Update the conversation property of a chat room by its ObjectId. */
    async updateChatRoomInstructions(roomId: ObjectId, roomInstructions: ChatRoomData["roomInstructions"]): Promise<number> {
        return await this.dbHelper.updateDataItems<ChatRoomData>(
            DbCollectionNames.ChatRooms,
            { _id: roomId },
            { roomInstructions },
            { updateOne: true }
        );
    }

    /** Deletes a specified message from the conversation of a specified chat room. */
    async deleteChatMessageFromConversation(roomId: ObjectId, messageId: string): Promise<void> {
        // Ensure the message ID is valid - we don't want any goofy mistakes here.
        if (messageId.trimEnd() === '') {
            throw new Error(`messageId cannot be empty.`);
        }

        return await this.dbHelper.makeCallWithCollection<undefined, ChatRoomData>(DbCollectionNames.ChatRooms, async (db, collection) => {
            await collection.updateOne({ _id: roomId, }, {
                $pull: {
                    conversation: {
                        //@ts-ignore  This actually works.
                        'data.additional_kwargs.id': messageId
                    }
                }
            });

            await collection.updateOne({ _id: roomId, }, {
                $pull: {
                    //@ts-ignore  This actually works.
                    conversation: { 'data.id': messageId }
                }
            });
        });
    }

    /** Updates a chat message in a specified room, with a specified message ID, to have new specified content. */
    async updateChatMessageContentInConversation(roomId: ObjectId, messageId: string, newContent: string): Promise<void> {
        // Ensure the message ID is valid - we don't want any goofy mistakes here.
        if (messageId.trimEnd() === '') {
            throw new Error(`messageId cannot be empty.`);
        }

        await this.dbHelper.makeCallWithCollection<undefined, ChatRoomData>(DbCollectionNames.ChatRooms, async (db, collection) => {
            await collection.updateOne(
                {
                    _id: roomId,
                    conversation: {
                        $elemMatch:
                            // For agent messages.
                            { 'data.id': messageId },
                    }
                },
                {
                    $set: {
                        "conversation.$.data.content": newContent
                    }
                }
            );
        });

        await this.dbHelper.makeCallWithCollection<undefined, ChatRoomData>(DbCollectionNames.ChatRooms, async (db, collection) => {
            await collection.updateOne(
                {
                    _id: roomId,
                    conversation: {
                        $elemMatch: {
                            // For user messages.
                            'data.additional_kwargs.id': messageId
                        }
                    }
                },
                {
                    $set: {
                        "conversation.$.data.content": newContent
                    }
                }
            );
        });
    };

    /** Updates a chat message in a specified room, with a specified message ID, to have new specified content. */
    async setVoiceMessageOnConversationMessage(roomId: ObjectId, messageId: string, voiceMessageId: ObjectId | undefined): Promise<void> {
        // Ensure the message ID is valid - we don't want any goofy mistakes here.
        if (messageId.trimEnd() === '') {
            throw new Error(`messageId cannot be empty.`);
        }

        const voiceMessageIdKey = `conversation.$.data.additional_kwargs.${MESSAGE_VOICE_CHAT_ID_KEY}`;

        await this.dbHelper.makeCallWithCollection<undefined, ChatRoomData>(DbCollectionNames.ChatRooms, async (db, collection) => {
            await collection.updateOne(
                {
                    _id: roomId,
                    conversation: {
                        $elemMatch:
                            // For agent messages.
                            { 'data.id': messageId },
                    }
                },
                {
                    $set: {
                        [voiceMessageIdKey]: voiceMessageId
                    }
                }
            );
        });

        await this.dbHelper.makeCallWithCollection<undefined, ChatRoomData>(DbCollectionNames.ChatRooms, async (db, collection) => {
            await collection.updateOne(
                {
                    _id: roomId,
                    conversation: {
                        $elemMatch: {
                            // For user messages.
                            'data.additional_kwargs.id': messageId
                        }
                    }
                },
                {
                    $set: {
                        [voiceMessageIdKey]: voiceMessageId
                    }
                }
            );
        });
    };

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
    };

    /**
     * Set the 'disabled' property of a Chat Job Instance in a specified Chat Room.
     */
    async setChatJobDisabled(roomId: ObjectId, jobId: ObjectId, disabled: boolean) {
        // Ensure jobId is valid
        if (!jobId) {
            throw new Error(`jobId cannot be empty.`);
        }
        // Update the 'disabled' property of the job with the specified jobId in the jobs array
        // @ts-ignore: MongoDB $elemMatch is valid for the query
        return await this.dbHelper.makeCallWithCollection<undefined, ChatRoomData>(DbCollectionNames.ChatRooms, async (db, collection) => {
            await collection.updateOne(
                {
                    _id: roomId,
                    // @ts-ignore
                    jobs: { $elemMatch: { id: jobId } }
                },
                {
                    $set: {
                        "jobs.$.disabled": disabled
                    }
                }
            );
        });

    }

    /** Updates the name of a specified chat room. */
    async updateChatRoomName(id: ObjectId, newName: string): Promise<void> {
        return await this.dbHelper.makeCallWithCollection(DbCollectionNames.ChatRooms, async (db, collection) => {
            await collection.updateOne({ _id: id }, { $set: { name: newName } });
        });
    }
}