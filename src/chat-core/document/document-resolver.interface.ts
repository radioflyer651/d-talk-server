import { ChatDocumentDbService } from "../../database/chat-core/chat-document-db.service";
import { IChatDocumentCreationParams, IChatDocumentData } from "../../model/shared-models/chat-core/documents/chat-document.model";
import { NewDbItem } from "../../model/shared-models/db-operation-types.model";
import { ChatDocument } from "./chat-document.service";


export interface IDocumentResolver<T_DOCUMENT_TYPE extends ChatDocument = ChatDocument, T_DOCUMENT_DATA extends IChatDocumentData = IChatDocumentData, T_DOCUMENT_CONFIGURATION extends IChatDocumentCreationParams = IChatDocumentCreationParams> {

    /** Returns a boolean value indicating whether or not this service can resolve a specified document type. */
    canResolveType(documentType: string): boolean;

    /** Given a set of creation configuration data, returns a new data set that can be stored in the database.
     *   A call to createNewDocument will follow this call, with the same data returned. (except an _id is set)*/
    createNewDocumentData(configuration: T_DOCUMENT_CONFIGURATION): Promise<NewDbItem<T_DOCUMENT_DATA>>;

    /** Returns a new instance of the flavor of document type this service handles. */
    createNewDocument(document: T_DOCUMENT_DATA, documentDbService: ChatDocumentDbService): Promise<T_DOCUMENT_TYPE>;

    /** Given a specified document data of the type this service handles, returns a new instance of that document type. */
    hydrateDocument(document: T_DOCUMENT_DATA, documentDbService: ChatDocumentDbService): Promise<T_DOCUMENT_TYPE>;

}