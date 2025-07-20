import { ChatDocumentReference } from "../../model/shared-models/chat-core/documents/chat-document-reference.model";

export interface IDocumentProvider {

    /** Gets all documents from the provider's document list. */
    getDocumentReferences(): Promise<ChatDocumentReference[]>;

    /** Adds a new document to the document list. */
    addDocumentReference(newReferences: ChatDocumentReference[]): Promise<void>;
}

/** TypeGuard for the IDocumentProvider type. */
export function isDocumentProvider(target: any): target is IDocumentProvider {
    return (
        typeof target === "object" &&
        target !== null &&
        typeof target.getDocumentReferences === "function" &&
        typeof target.addDocumentReference === "function"
    );
}