import { BaseMessage } from "@langchain/core/messages";
import { ObjectId } from "mongodb";
import { ChatJobConfiguration } from "../../model/shared-models/chat-core/chat-job-data.model";
import { ChatJobInstance } from "../../model/shared-models/chat-core/chat-job-instance.model";
import { PositionableMessage } from "../../model/shared-models/chat-core/positionable-message.model";
import { AgentPluginBase, PluginAttachmentTarget } from "../agent-plugin/agent-plugin-base.service";
import { IChatLifetimeContributor, ChatCallInfo } from "../chat-lifetime-contributor.interface";
import { createIdForMessage } from "../utilities/set-message-id.util";
import { IDisposable } from "../disposable.interface";
import { IDocumentProvider } from "../document/document-provider.interface";
import { ChatDocumentReference } from "../../model/shared-models/chat-core/documents/chat-document-reference.model";


export class ChatJob implements IChatLifetimeContributor, IDisposable, PluginAttachmentTarget, IDocumentProvider {
    constructor(
        readonly data: ChatJobConfiguration,
        readonly instanceData: ChatJobInstance,
    ) {

    }

    dispose() {
        // Do nothing.
    }

    get myName() {
        return this.data.name;
    }

    /** The set of plugins used in this chat job. */
    plugins: AgentPluginBase[] = [];

    get agentId(): ObjectId | undefined {
        return this.instanceData.agentId;
    }
    set agentId(value: ObjectId | undefined) {
        this.instanceData.agentId = value;
    }

    positionableMessages: PositionableMessage<BaseMessage>[] = [];

    /** Gets all documents from the provider's document list. */
    async getDocumentReferences(): Promise<ChatDocumentReference[]> {
        return this.data.chatDocumentReferences;
    }

    /** Adds a new document to the document list. */
    async addDocumentReference(newReferences: ChatDocumentReference[]): Promise<void> {
        this.data.chatDocumentReferences.push(...newReferences);
    }

    async addPreChatMessages(info: ChatCallInfo): Promise<PositionableMessage<BaseMessage>[]> {
        // The job should have the most important system information to inform the LLM on.  Make sure it's stuff is last.
        if (info.replyNumber === 0) {
            // Create a deep clone of the messages.
            const clones = this.positionableMessages.slice();

            // Update the IDs on the messages.
            clones.forEach(c => c.message.id = createIdForMessage());

            return clones;
        }

        // If we're on a reply, then we don't need to do anything here.  Our message is already in the list.
        return [];
    }
}