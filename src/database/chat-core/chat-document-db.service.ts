import { MongoHelper } from "../../mongo-helper";
import { DbService } from "../db-service";
import { ObjectId } from "mongodb";
import { DbCollectionNames } from "../../model/db-collection-names.constants";
import { IChatDocumentData } from "../../model/shared-models/chat-core/documents/chat-document.model";

export class ChatDocumentDbService extends DbService {
    constructor(dbHelper: MongoHelper) {
        super(dbHelper);
    }

    /** Create a new chat document. */
    async createDocument(doc: IChatDocumentData): Promise<IChatDocumentData> {
        await this.dbHelper.upsertDataItem<IChatDocumentData>(DbCollectionNames.ChatDocuments, doc);
        return doc;
    }

    /** Get a chat document by its ObjectId. */
    async getDocumentById(documentId: ObjectId): Promise<IChatDocumentData | undefined> {
        return await this.dbHelper.findDataItem<IChatDocumentData>(
            DbCollectionNames.ChatDocuments,
            { _id: documentId },
            { findOne: true }
        ) as IChatDocumentData | undefined;
    }

    /** Update a chat document by its ObjectId. */
    async updateDocument(documentId: ObjectId, update: Partial<IChatDocumentData>): Promise<number> {
        return await this.dbHelper.updateDataItems<IChatDocumentData>(
            DbCollectionNames.ChatDocuments,
            { _id: documentId },
            update,
            { updateOne: true }
        );
    }

    /** Delete a chat document by its ObjectId. */
    async deleteDocument(documentId: ObjectId): Promise<number> {
        return await this.dbHelper.deleteDataItems<IChatDocumentData>(
            DbCollectionNames.ChatDocuments,
            { _id: documentId },
            { deleteMany: false }
        );
    }

    /** List all chat documents for a given project. */
    async getDocumentsByProject(projectId: ObjectId): Promise<IChatDocumentData[]> {
        return await this.dbHelper.findDataItem<IChatDocumentData, { projectId: ObjectId; }>(
            DbCollectionNames.ChatDocuments,
            { projectId }
        ) as IChatDocumentData[];
    }

    /** List lightweight document items for a given project (excluding content and comments) using DB projection. */
    async getDocumentListItemsByProject(projectId: ObjectId): Promise<IChatDocumentData[]> {
        // Because each document type has a different form, we want only the base document data
        //  for listing purposes.  Otherwise, our content will be too heavy.
        const projection = {
            _id: 1,
            folderLocation: 1,
            projectId: 1,
            createdDate: 1,
            updatedDate: 1,
            lastChangedBy: 1,
            name: 1,
            description: 1,
        } as any;
        return await this.dbHelper.findDataItemWithProjection<IChatDocumentData>(
            DbCollectionNames.ChatDocuments,
            { projectId },
            projection,
            { findOne: false }
        );
    }
}