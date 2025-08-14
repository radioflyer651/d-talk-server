import { AgentPluginBase } from "../../agent-plugin/agent-plugin-base.service";
import { IChatLifetimeContributor } from "../../chat-lifetime-contributor.interface";
import { IGNORE_SPECIFIC_AGENT_PLUGIN_TYPE_ID } from "../../../model/shared-models/chat-core/plugins/plugin-type-constants.data";
import { PluginInstanceReference } from "../../../model/shared-models/chat-core/plugin-instance-reference.model";
import { isPluginSpecification, PluginSpecification } from "../../../model/shared-models/chat-core/plugin-specification.model";
import { IgnoreSpecificAgentPluginParms } from "../../../model/shared-models/chat-core/plugins/ignore-specific-agent-plugin.params";
import { ObjectId } from "mongodb";
import { BaseMessage } from "@langchain/core/messages";
import { copyBaseMessages } from "../../../utils/copy-base-message.utils";
import { getSpeakerFromMessage } from "../../../model/shared-models/chat-core/utils/messages.utils";
import { LifetimeContributorPriorityTypes } from "../../lifetime-contributor-priorities.enum";

/**
 * Plugin: Ignore Specific Agent
 * (Boilerplate only. Implement logic as needed.)
 */
export class IgnoreSpecificAgentPlugin extends AgentPluginBase implements IChatLifetimeContributor {
    constructor(params: PluginInstanceReference<IgnoreSpecificAgentPluginParms> | PluginSpecification<IgnoreSpecificAgentPluginParms>) {
        super(params);

    }

    agentUserManual?: string | undefined;
    readonly type = IGNORE_SPECIFIC_AGENT_PLUGIN_TYPE_ID;

    priority: LifetimeContributorPriorityTypes = LifetimeContributorPriorityTypes.WithLeastContext;

    getAgentFromAgentInstance(instanceId: string | undefined) {
        return this.chatRoom.agents.find(a => a.data._id.toString() === instanceId);
    }

    async modifyCallMessages?(messageHistory: BaseMessage[]): Promise<BaseMessage[]> {
        let newMessages = copyBaseMessages(messageHistory);

        const specification = this.specification!.configuration as IgnoreSpecificAgentPluginParms;

        const agentsIds = specification.agentIds;

        newMessages = newMessages.filter(m => {
            const speaker = getSpeakerFromMessage(m);
            const agent = this.getAgentFromAgentInstance(speaker?.speakerId);
            if (agentsIds.some(id => id.toString() === agent?.identity._id.toString())) {
                return false;
            } else {
                return true;
            }
        });

        return newMessages;
    }
}
