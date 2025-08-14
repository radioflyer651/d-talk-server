import { AgentPluginBase } from "../../agent-plugin/agent-plugin-base.service";
import { ChatCallInfo, IChatLifetimeContributor } from "../../chat-lifetime-contributor.interface";
import { LABEL_AGENT_SPEAKERS_PLUGIN_TYPE_ID } from "../../../model/shared-models/chat-core/plugins/plugin-type-constants.data";
import { BaseMessage, AIMessage, SystemMessage, HumanMessage } from "@langchain/core/messages";
import { copyBaseMessages } from "../../../utils/copy-base-message.utils";
import { getSpeakerFromMessage } from "../../../model/shared-models/chat-core/utils/messages.utils";
import { PluginInstanceReference } from "../../../model/shared-models/chat-core/plugin-instance-reference.model";
import { PluginSpecification } from "../../../model/shared-models/chat-core/plugin-specification.model";
import { MessagePositionTypes, PositionableMessage } from "../../../model/shared-models/chat-core/positionable-message.model";
import { LifetimeContributorPriorityTypes } from "../../lifetime-contributor-priorities.enum";

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

    priority: LifetimeContributorPriorityTypes = LifetimeContributorPriorityTypes.AppendMetaData;

    async modifyCallMessages(messageHistory: BaseMessage[]): Promise<BaseMessage[]> {
        const newHistory: BaseMessage[] = [];

        messageHistory.forEach(h => {
            if (h instanceof AIMessage || h instanceof HumanMessage) {
                const speaker = getSpeakerFromMessage(h);
                if (speaker) {
                    if (this.agent?.data._id.equals(speaker.speakerId)) {
                        newHistory.push(new SystemMessage(`The following message is from you (${speaker.name}, ID: ${speaker.speakerId}).`));
                    } else {
                        newHistory.push(new SystemMessage(`The following message is from (ID: ${speaker.speakerId}) ${speaker.name}`));
                    }
                }

                newHistory.push(h);;

            } else {
                newHistory.push(h);

            }
        });

        return newHistory;
    }

    async addPreChatMessages?(info: ChatCallInfo): Promise<PositionableMessage<BaseMessage>[]> {
        if (info.replyNumber === 0) {
            return [
                { location: MessagePositionTypes.OffsetFromEnd, offset: 1, message: new SystemMessage(`You are ${this.agent.myName}.  Your agent ID is ${this.agent.data._id}. ${this.doNotInclude}`) }
            ] as PositionableMessage<BaseMessage>[];
        }

        return [];
    }
}