import { MongoHelper } from "../../mongo-helper";
import { DbService } from "../db-service";
import { ObjectId } from "mongodb";
import { DbCollectionNames } from "../../model/db-collection-names.constants";
import { IChatDocumentData, IChatDocumentListItem } from "../../model/shared-models/chat-core/documents/chat-document.model";
import { NewDbItem } from "../../model/shared-models/db-operation-types.model";

export class ChatDocumentDbService extends DbService {
    constructor(dbHelper: MongoHelper) {
        super(dbHelper);
    }

    /** Create a new chat document. */
    async createDocument(doc: NewDbItem<IChatDocumentData>): Promise<IChatDocumentData> {
        const result = await this.dbHelper.upsertDataItem<IChatDocumentData>(DbCollectionNames.ChatDocuments, doc);
        return result;
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


    /** Delete a document by its ObjectId. */
    async deleteDocumentsByProjectId(projectId: ObjectId): Promise<number> {
        return await this.dbHelper.deleteDataItems<IChatDocumentData>(
            DbCollectionNames.ChatDocuments,
            { projectId: projectId },
            { deleteMany: true }
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

    /** Get multiple chat documents by their ObjectIds. */
    async getDocumentsByIds(documentIds: ObjectId[]): Promise<IChatDocumentData[]> {
        return await this.dbHelper.findDataItem<IChatDocumentData, { _id: { $in: ObjectId[]; }; }>(
            DbCollectionNames.ChatDocuments,
            { _id: { $in: documentIds } }
        ) as IChatDocumentData[];
    }

    /**
     * Returns an array of IChatDocumentListItem for all documents in a project whose folderLocation starts with the given prefix.
     * @param projectId The project to search within.
     * @param folderPrefix The prefix for the folderLocation (e.g., "folder1/folder2").
     */
    async getDocumentListItemsByFolderPrefix(
        projectId: ObjectId,
        folderPrefix: string
    ): Promise<IChatDocumentListItem[]> {
        // Ensure the prefix ends with a slash for subfolder matching
        const prefix = folderPrefix.endsWith('/') ? folderPrefix.substring(0, folderPrefix.length - 2) : folderPrefix;
        const projection = {
            _id: 1 as 1,
            name: 1 as 1,
            type: 1 as 1,
            folderLocation: 1 as 1,
            description: 1 as 1,
            projectId: 1 as 1
        };
        return await this.dbHelper.findDataItemWithProjection<
            IChatDocumentData,
            typeof projection,
            any
        >(
            DbCollectionNames.ChatDocuments,
            {
                projectId,
                $or: [
                    { folderLocation: folderPrefix },
                    { folderLocation: { $regex: `^${prefix}` } }
                ]
            } as any,
            projection,
            { findOne: false }
        ) as IChatDocumentListItem[];
    }

    /**
     * Returns an array of IChatDocumentData for all documents in a project with the specified name.
     * @param projectId The project to search within.
     * @param name The name of the document(s) to find.
     */
    async getDocumentsByName(
        projectId: ObjectId,
        name: string
    ): Promise<IChatDocumentData[]> {
        return await this.dbHelper.findDataItem<IChatDocumentData, { projectId: ObjectId; name: string }>(
            DbCollectionNames.ChatDocuments,
            { projectId, name },
            { findOne: false }
        ) as IChatDocumentData[];
    }

}