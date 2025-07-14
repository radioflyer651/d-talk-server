import { IChatDocumentCreationParams } from "./chat-document.model";
import { ObjectId } from "mongodb";

export const TEXT_DOCUMENT_TYPE = 'text';

export interface DocumentInfo {
    documentType: string;
    displayName: string;
    createDefaultParameters: (projectId: ObjectId, userId: ObjectId) => IChatDocumentCreationParams;
}

export const documentInformation: DocumentInfo[] = [
    {
        documentType: TEXT_DOCUMENT_TYPE,
        displayName: 'Text Document',
        createDefaultParameters: (projectId: ObjectId, userId: ObjectId) => createDefaultParamsBase(TEXT_DOCUMENT_TYPE, projectId, userId)
    }
];

function createDefaultParamsBase(docType: string, projectId: ObjectId, userId: ObjectId): IChatDocumentCreationParams {
    return {
        name: "New Document",
        type: docType,
        folderLocation: 'documents',
        projectId: projectId,
        lastChangedBy: { entityType: 'user', id: userId }
    };
}