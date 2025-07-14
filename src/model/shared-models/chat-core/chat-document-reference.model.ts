import { ObjectId } from "mongodb";
import { ChatDocumentPermissions } from "./chat-document-permissions.model";

export interface ChatDocumentReference {
    /** Gets or sets the ID of the document this is for. */
    documentId: ObjectId,

    /** The permissions that the referencing object has to the associated document. */
    permission: ChatDocumentPermissions;
}

