import { MongoHelper } from "../../mongo-helper";
import { DbService } from "../db-service";
import { ObjectId } from "mongodb";
import { VoiceFileReference } from "../../model/shared-models/chat-core/voice/voice-file-reference.model";
import { UpsertDbItem } from "../../model/shared-models/db-operation-types.model";
import { DbCollectionNames } from "../../model/db-collection-names.constants";

/**
 * Service for handling CRUD operations for VoiceFileReference documents.
 */
export class VoiceFileReferenceDbService extends DbService {
    constructor(dbHelper: MongoHelper) {
        super(dbHelper);
    }

    /** Create or update a VoiceFileReference. */
    async upsertVoiceFileReference(item: UpsertDbItem<VoiceFileReference>): Promise<VoiceFileReference> {
        return await this.dbHelper.upsertDataItem<any>(DbCollectionNames.VoiceFileReferences, item) as VoiceFileReference;
    }

    /** Get a VoiceFileReference by its ObjectId. */
    async getVoiceFileReferenceById(id: ObjectId): Promise<VoiceFileReference | undefined> {
        return await this.dbHelper.findDataItem<VoiceFileReference, { _id: ObjectId }>(
            DbCollectionNames.VoiceFileReferences,
            { _id: id },
            { findOne: true }
        ) as VoiceFileReference | undefined;
    }

    /** Update a VoiceFileReference by its ObjectId. */
    async updateVoiceFileReference(id: ObjectId, update: Partial<VoiceFileReference>): Promise<number> {
        return await this.dbHelper.updateDataItems<VoiceFileReference>(
            DbCollectionNames.VoiceFileReferences,
            { _id: id },
            update,
            { updateOne: true }
        );
    }

    /** Delete a VoiceFileReference by its ObjectId. */
    async deleteVoiceFileReference(id: ObjectId): Promise<number> {
        return await this.dbHelper.deleteDataItems<VoiceFileReference, { _id: ObjectId }>(
            DbCollectionNames.VoiceFileReferences,
            { _id: id },
            { deleteMany: false }
        );
    }

    /** Delete all VoiceFileReference documents for a given chatRoomId. */
    async deleteAllByChatRoomId(chatRoomId: string): Promise<number> {
        return await this.dbHelper.deleteDataItems<VoiceFileReference>(
            DbCollectionNames.VoiceFileReferences,
            { chatRoomId },
            { deleteMany: true }
        );
    }
}
