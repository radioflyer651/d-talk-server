import { IChatDocumentData } from "../../model/shared-models/chat-core/documents/chat-document.model";
import { ChatDocumentDbService } from "../../database/chat-core/chat-document-db.service";
import { ChatDocumentPermissions, combinePermissions } from "../../model/shared-models/chat-core/documents/chat-document-permissions.model";
import { IChatLifetimeContributor } from "../chat-lifetime-contributor.interface";
import { type ChatRoom } from "../chat-room/chat-room.service";
import { type ChatJob } from "../chat-room/chat-job.service";
import { type Agent } from "../agent/agent.service";
import { ChatDocumentLinker } from "../../model/shared-models/chat-core/documents/chat-document-reference.model";
import { IDisposable } from "../disposable.interface";


export abstract class ChatDocument implements IDisposable {
    constructor(
        readonly data: IChatDocumentData,
        readonly documentDbService: ChatDocumentDbService,
    ) {

    }

    /** Cleanup method. */
    abstract dispose(): void;

    /** The permissions for this document, combined for all references (room, agent, etc). */
    permissions: ChatDocumentPermissions = {};

    /** Returns all IChatLifetimeContributor objects that play a role in the chat call to come. 
     *   All items contributing to the call are past to the method to help determine permissions and other matters. */
    abstract getLifetimeContributors(chatRoom: ChatRoom, chatJob: ChatJob, chatAgent: Agent): Promise<IChatLifetimeContributor[]>;

    /** Given all contributors to a specific chat call, determines the permissions pertaining to this document, based on what the contributors have set on their properties. */
    protected determinePermissions(chatRoom: ChatRoom, chatJob: ChatJob, chatAgent: Agent): ChatDocumentPermissions {
        const allItems: ChatDocumentLinker[] = [chatRoom.data, chatJob.data, chatAgent.identity, chatAgent.data];

        // Find the references related to this document.
        const references = allItems.map(x => (x.chatDocumentReferences ?? [])
            .filter(r => r.documentId.equals(this.data._id)))
            .reduce((p, c) => [...p, ...c], []);

        // Return the combined permissions for these.
        return combinePermissions(references.map(r => r.permission));
    }
}

