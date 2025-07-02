import { SystemMessage } from "@langchain/core/messages";
import { AgentPluginBase } from "../../agent-plugin/agent-plugin-base.service";
import { ChatCallInfo, IChatLifetimeContributor } from "../../chat-lifetime-contributor.interface";
import { MessagePositionTypes, PositionableMessage } from "../model/positionable-message.model";
import { ChatJobData } from "../../../model/shared-models/chat-core/chat-job-data.model";
import { createIdForMessage } from "../../utilities/set-message-id.util";

export class ChatJob implements IChatLifetimeContributor {
    constructor(
        readonly data: ChatJobData,
    ) {

    }

    get myName() {
        return this.data.name;
    }

    /** The set of plugins used in this chat job. */
    plugins: AgentPluginBase[] = [];

    async addPreChatMessages(info: ChatCallInfo): Promise<PositionableMessage[]> {
        // The job should have the most important system information to inform the LLM on.  Make sure it's stuff is last.
        if (info.replyNumber === 0) {
            return [{
                location: MessagePositionTypes.Last,
                messages: this.data.instructions.map(ins => new SystemMessage(ins, { id: createIdForMessage() }))
            }];
        }

        // If we're on a reply, then we don't need to do anything here.  Our message is already in the list.
        return [];
    }
}