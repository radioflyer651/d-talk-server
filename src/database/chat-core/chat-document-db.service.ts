import { MongoHelper } from "../../mongo-helper";
import { DbService } from "../db-service";
import { ChatDocumentData, ChatDocumentDataListItem } from "../../model/shared-models/chat-core/chat-document.model";
import { ObjectId } from "mongodb";
import { DbCollectionNames } from "../../model/db-collection-names.constants";

export class ChatDocumentDbService extends DbService {
    constructor(dbHelper: MongoHelper) {
        super(dbHelper);
    }

    /** Create a new chat document. */
    async createDocument(doc: ChatDocumentData): Promise<ChatDocumentData> {
        await this.dbHelper.upsertDataItem<ChatDocumentData>(DbCollectionNames.ChatDocuments, doc);
        return doc;
    }

    /** Get a chat document by its ObjectId. */
    async getDocumentById(documentId: ObjectId): Promise<ChatDocumentData | undefined> {
        return await this.dbHelper.findDataItem<ChatDocumentData>(
            DbCollectionNames.ChatDocuments,
            { _id: documentId },
            { findOne: true }
        ) as ChatDocumentData | undefined;
    }

    /** Update a chat document by its ObjectId. */
    async updateDocument(documentId: ObjectId, update: Partial<ChatDocumentData>): Promise<number> {
        return await this.dbHelper.updateDataItems<ChatDocumentData>(
            DbCollectionNames.ChatDocuments,
            { _id: documentId },
            update,
            { updateOne: true }
        );
    }

    /** Delete a chat document by its ObjectId. */
    async deleteDocument(documentId: ObjectId): Promise<number> {
        return await this.dbHelper.deleteDataItems<ChatDocumentData>(
            DbCollectionNames.ChatDocuments,
            { _id: documentId },
            { deleteMany: false }
        );
    }

    /** List all chat documents for a given project. */
    async getDocumentsByProject(projectId: ObjectId): Promise<ChatDocumentData[]> {
        return await this.dbHelper.findDataItem<ChatDocumentData, { projectId: ObjectId; }>(
            DbCollectionNames.ChatDocuments,
            { projectId }
        ) as ChatDocumentData[];
    }

    /** List lightweight document items for a given project (excluding content and comments) using DB projection. */
    async getDocumentListItemsByProject(projectId: ObjectId): Promise<ChatDocumentDataListItem[]> {
        // Exclude 'content' and 'comments' fields from the result
        const projection = { content: 0, comments: 0 } as any;
        return await this.dbHelper.findDataItemWithProjection<ChatDocumentDataListItem>(
            DbCollectionNames.ChatDocuments,
            { projectId },
            projection,
            { findOne: false }
        );
    }
}