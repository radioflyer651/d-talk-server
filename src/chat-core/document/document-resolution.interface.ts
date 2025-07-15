import { ObjectId } from "mongodb";
import { IChatDocumentCreationParams, IChatDocumentData } from "../../model/shared-models/chat-core/documents/chat-document.model";
import { ChatDocument } from "./chat-document.service";
import { ChatDocumentLinker } from "../../model/shared-models/chat-core/documents/chat-document-reference.model";


export interface IChatDocumentResolutionService {

    /** Returns all hydrated documents for a specified project. */
    getDocumentsForProjectId(projectId: ObjectId): Promise<ChatDocument[]>;

    /** Returns all documents for a specified set of linked objects. */
    getDocumentsForLinkedObjects(linkedObjects: ChatDocumentLinker[]): Promise<ChatDocument[]>;

    /** Creates a new ChatDocument of a specified type. */
    createNewDocument(configuration: IChatDocumentCreationParams): Promise<ChatDocument>;

    /** Returns a new instance of a ChatDocument for a specified set of document data. */
    hydrateDocument(document: IChatDocumentData): Promise<ChatDocument>;
}