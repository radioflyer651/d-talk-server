import { ObjectId } from "mongodb";
import { ChatDocumentDbService } from "../../database/chat-core/chat-document-db.service";
import { IChatDocumentCreationParams, IChatDocumentData } from "../../model/shared-models/chat-core/documents/chat-document.model";
import { ChatDocument } from "./chat-document.service";
import { IDocumentResolver } from "./document-resolver.interface";
import { IChatDocumentResolutionService } from "./document-resolution.interface";
import { ChatDocumentLinker, ChatDocumentReference } from "../../model/shared-models/chat-core/documents/chat-document-reference.model";
import { combinePermissions } from "../../model/shared-models/chat-core/documents/chat-document-permissions.model";

export class ChatDocumentResolutionService implements IChatDocumentResolutionService {
    constructor(
        readonly documentResolvers: IDocumentResolver[],
        readonly documentDbService: ChatDocumentDbService,
    ) { }

    private getResolverForType(type: string): IDocumentResolver | undefined {
        return this.documentResolvers.find(r => r.canResolveType(type));
    }

    /** Returns all hydrated documents for a specified project. */
    async getDocumentsForProjectId(projectId: ObjectId): Promise<ChatDocument[]> {
        // Get the document data.
        const data = await this.documentDbService.getDocumentsByProject(projectId);

        // Exit early if we have nothing.
        if (data.length < 1) {
            return [];
        }

        // Hydrate them.
        const hydratedP = data.map(d => this.hydrateDocument(d));

        // Wait for them to complete.
        const result = await Promise.all(hydratedP);

        // Return them.
        return result;
    }

    /** Returns all documents for a specified set of linked objects. */
    async getDocumentsForLinkedObjects(linkedObjects: ChatDocumentLinker[]): Promise<ChatDocument[]> {
        const docRefs = linkedObjects.map(l => l.chatDocumentReferences ?? []).reduce((p, c) => [...p, ...c], []);

        // Group all of the sets, based on id.
        const group = new Map<string, ChatDocumentReference[]>();
        docRefs.forEach(r => {
            let item = group.get(r.documentId.toString());
            if (!item) {
                item = [];
                group.set(r.documentId.toString(), item);
            }
            item.push(r);
        });

        // Get all of the document data.
        const docIds: ObjectId[] = [];
        for (let r of group.values()) {
            docIds.push(r[0].documentId);
        }

        const documents = await this.documentDbService.getDocumentsByIds(docIds);

        // Hydrate each of the references, but only ones.
        const resultsP = documents.map(async (doc) => {
            // Hydrate the document.
            const newDoc = await this.hydrateDocument(doc);

            // Get all permissions for this document.
            const allPermissions = group.get(doc._id.toString())!;

            // Set the permissions on this.
            // NOTE: THis doesn't really matter here, because the permissions need to be combined
            //  for the room/agent/job combination - which is only done at execution time.
            newDoc.permissions = combinePermissions(allPermissions.map(r => r.permission));

            // Return the document.
            return newDoc;
        });

        // Wait for all results to finish, and return them.
        return await Promise.all(resultsP);
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

        // Save this data.
        const docData = await this.documentDbService.createDocument(params);

        // Return the new instance.
        return await resolver.createNewDocument(docData, this.documentDbService);
    }

    /** Returns a new instance of a ChatDocument for a specified set of document data. */
    async hydrateDocument(document: IChatDocumentData): Promise<ChatDocument> {
        // Get the resolver.
        const resolver = this.getResolverForType(document.type);

        if (!resolver) {
            throw new Error(`Resolver not found for type: ${document.type}`);
        }

        return await resolver.hydrateDocument(document, this.documentDbService);
    }
}