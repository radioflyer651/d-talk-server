import { AgentPluginBase } from "../../agent-plugin/agent-plugin-base.service";
import { ChatCallInfo, IChatLifetimeContributor } from "../../chat-lifetime-contributor.interface";
import { LABEL_AGENT_SPEAKERS_PLUGIN_TYPE_ID } from "../../../model/shared-models/chat-core/plugins/plugin-type-constants.data";
import { BaseMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { copyBaseMessages } from "../../../utils/copy-base-message.utils";
import { getSpeakerFromMessage } from "../../utilities/speaker.utils";
import { PluginInstanceReference } from "../../../model/shared-models/chat-core/plugin-instance-reference.model";
import { PluginSpecification } from "../../../model/shared-models/chat-core/plugin-specification.model";
import { MessagePositionTypes, PositionableMessage } from "../../../model/shared-models/chat-core/positionable-message.model";

/**
 * Plugin: Label Agent Speakers
 * (Boilerplate only. Implement logic as needed.)
 */
export class LabelAgentSpeakersPlugin extends AgentPluginBase implements IChatLifetimeContributor {
    constructor(params: PluginInstanceReference | PluginSpecification) {
        super(params);
    }

    agentUserManual?: string | undefined;
    readonly type = LABEL_AGENT_SPEAKERS_PLUGIN_TYPE_ID;


    private readonly doNotInclude = ` This header information is provided to you for your convenience.  Do NOT append lines like this to your response.`;
    private readonly doNotIncludeWithDashes = this.doNotInclude + `\n----------------------\n\n`;

    async modifyCallMessages(messageHistory: BaseMessage[]): Promise<BaseMessage[]> {

        const copiedMessages = copyBaseMessages(messageHistory);
        const result = copiedMessages.map(message => {
            if (message instanceof AIMessage) {
                const speaker = getSpeakerFromMessage(message);
                if (this.agent.data._id.equals(speaker?.speakerId)) {
                    message.content = `AgentId: ${speaker?.speakerId}(You, ${message.name})${this.doNotIncludeWithDashes}${message.content.toString()} `;
                } else {
                    message.content = `AgentId: ${speaker?.speakerId} (NOT You, Their Name Is ${message.name})${this.doNotIncludeWithDashes}${message.content.toString()}`;
                }
            }

            return message;
        });

        return result;
    }

    async addPreChatMessages?(info: ChatCallInfo): Promise<PositionableMessage<BaseMessage>[]> {
        if (info.replyNumber === 0) {
            return [
                { location: MessagePositionTypes.AfterAgentIdentity, message: new SystemMessage(`You are ${this.agent.myName}.  Your agent ID is ${this.agent.data._id}. ${this.doNotInclude}`) }
            ] as PositionableMessage<BaseMessage>[];
        }

        return [];
    }
}