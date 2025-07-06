import { BaseMessage, SystemMessage } from "@langchain/core/messages";
import { AgentPluginBase } from "../../agent-plugin/agent-plugin-base.service";
import { ChatCallInfo, IChatLifetimeContributor } from "../../chat-lifetime-contributor.interface";
import { PositionableMessage } from "../../../model/shared-models/chat-core/positionable-message.model";
import { ChatJobConfiguration } from "../../../model/shared-models/chat-core/chat-job-data.model";
import { createIdForMessage } from "../../utilities/set-message-id.util";
import { ChatJobInstance } from "../../../model/shared-models/chat-core/chat-job-instance.model";
import { ObjectId } from "mongodb";

export class ChatJob implements IChatLifetimeContributor {
    constructor(
        readonly data: ChatJobConfiguration,
        readonly instanceData: ChatJobInstance,
    ) {

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

    async addPreChatMessages(info: ChatCallInfo): Promise<PositionableMessage<BaseMessage>[]> {
        // The job should have the most important system information to inform the LLM on.  Make sure it's stuff is last.
        if (info.replyNumber === 0) {
            // Create a deep clone of the messages.
            const clones = this.positionableMessages.map(msg => JSON.parse(JSON.stringify(msg))) as PositionableMessage<BaseMessage>[];

            // Update the IDs on the messages.
            clones.forEach(c => c.message.id = createIdForMessage());

            return clones;
        }

        // If we're on a reply, then we don't need to do anything here.  Our message is already in the list.
        return [];
    }
}