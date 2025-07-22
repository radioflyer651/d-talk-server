import { BaseMessage } from "@langchain/core/messages";
import { AgentPluginBase } from "../../agent-plugin/agent-plugin-base.service";
import { OTHER_AGENTS_INVISIBLE_PLUGIN } from "../../../model/shared-models/chat-core/plugins/plugin-type-constants.data";
import { PluginInstanceReference } from "../../../model/shared-models/chat-core/plugin-instance-reference.model";
import { PluginSpecification } from "../../../model/shared-models/chat-core/plugin-specification.model";
import { copyBaseMessages } from "../../../utils/copy-base-message.utils";
import { getSpeakerFromMessage } from "../../../model/shared-models/chat-core/utils/messages.utils";


export class OtherAgentsInvisiblePlugin extends AgentPluginBase {
    readonly type: string = OTHER_AGENTS_INVISIBLE_PLUGIN;
    agentUserManual?: string | undefined;

    constructor(params: PluginInstanceReference<undefined> | PluginSpecification<undefined>) {
        super(params);
    }

    /**
     * Allows the contributor to modify the message history before the chat call is made.
     * Should return the updated list of messages.
     */
    async modifyCallMessages?(messageHistory: BaseMessage[]): Promise<BaseMessage[]> {
        let newMessages = copyBaseMessages(messageHistory);

        newMessages = newMessages.filter(m => {
            if (m.getType() === 'ai') {
                const speaker = getSpeakerFromMessage(m);
                const res = speaker?.speakerId === this.agent.data._id.toString();
                console.log(`Removing Messages: filter(${res}) ${speaker?.speakerId}, ${this.agent.data._id.toString()}`);
                return res;
            } else {
                return true;
            }
        });

        return newMessages;
    }

}