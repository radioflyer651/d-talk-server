import { IChatDocumentCreationParams, IChatDocumentData } from "../../model/shared-models/chat-core/documents/chat-document.model";
import { ChatDocument } from "./chat-document.service";
import { IDocumentResolver } from "./document-resolver.interface";


export class ChatDocumentResolutionService {
    constructor(
        readonly documentResolvers: IDocumentResolver[]
    ) { }

    private getResolverForType(type: string): IDocumentResolver | undefined {
        return this.documentResolvers.find(r => r.canResolveType(type));
    }

    /** Creates a new ChatDocument of a specified type. */
    async createNewDocument(configuration: IChatDocumentCreationParams): Promise<ChatDocument> {
        const type = configuration.type;

        // Get the resolver.
        const resolver = this.getResolverForType(type);

        if (!resolver) {
            throw new Error(`Resolver not found for type: ${type}`);
        }

        // Create the new parameters for this document type.
        const params = await resolver.createNewDocumentData(configuration);

        // Return the new instance.
        return await resolver.createNewDocument(params);
    }

    /** Returns a new instance of a ChatDocument for a specified set of document data. */
    async hydrateDocument(document: IChatDocumentData): Promise<ChatDocument> {
        // Get the resolver.
        const resolver = this.getResolverForType(document.type);

        if (!resolver) {
            throw new Error(`Resolver not found for type: ${document.type}`);
        }

        return await resolver.hydrateDocument(document);
    }
}