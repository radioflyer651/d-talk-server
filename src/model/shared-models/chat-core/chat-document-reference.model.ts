import { ObjectId } from "mongodb";
import { ChatDocumentPermissions } from "./chat-document-permissions.model";

export interface ChatDocumentReference {
    /** Gets or sets the ID of the document this is for. */
    documentId: ObjectId,

    /** The permissions that the referencing object has to the associated document. */
    permission: ChatDocumentPermissions;
}

/** Represents a type that references a chat model and permissions for use in chat interactions. */
export interface ChatDocumentLinker {
    /** Set of referenced chat documents, with associated permissions for use with this object. */
    chatDocumentReferences: ChatDocumentReference[];
}