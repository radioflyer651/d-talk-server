import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { AgentPluginBase } from "../../agent-plugin/agent-plugin-base.service";
import { OTHER_AGENT_MESSAGES_AS_USER } from "../../../model/shared-models/chat-core/plugins/plugin-type-constants.data";
import { PluginInstanceReference } from "../../../model/shared-models/chat-core/plugin-instance-reference.model";
import { PluginSpecification } from "../../../model/shared-models/chat-core/plugin-specification.model";
import { copyBaseMessages } from "../../../utils/copy-base-message.utils";
import { getSpeakerFromMessage } from "../../../model/shared-models/chat-core/utils/messages.utils";
import { LifetimeContributorPriorityTypes } from "../../lifetime-contributor-priorities.enum";


export class OtherAgentMessagesAsUserPlugin extends AgentPluginBase {
    readonly type: string = OTHER_AGENT_MESSAGES_AS_USER;
    agentUserManual?: string | undefined;

    priority: LifetimeContributorPriorityTypes = LifetimeContributorPriorityTypes.WithLeastContext;

    constructor(params: PluginInstanceReference<undefined> | PluginSpecification<undefined>) {
        super(params);
    }

    async modifyCallMessages?(messageHistory: BaseMessage[]): Promise<BaseMessage[]> {
        let newMessages = copyBaseMessages(messageHistory);

        newMessages = newMessages.map(m => {
            if (m.getType() === 'ai') {
                const speaker = getSpeakerFromMessage(m);
                if (speaker?.speakerId !== this.agent.data._id.toString()) {
                    const newMessage = new HumanMessage(m.text);
                    newMessage.additional_kwargs = m.additional_kwargs;
                    newMessage.name = m.name;
                    return newMessage;
                }

                return m;
            } else {
                return m;
            }
        });

        return newMessages;
    }

}