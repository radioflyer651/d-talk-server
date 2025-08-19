import { BaseMessage } from "@langchain/core/messages";
import { AgentPluginBase } from "../../agent-plugin/agent-plugin-base.service";
import { PluginInstanceReference } from "../../../model/shared-models/chat-core/plugin-instance-reference.model";
import { PluginSpecification } from "../../../model/shared-models/chat-core/plugin-specification.model";
import { USER_MESSAGES_IGNORED_PLUGIN_TYPE_ID } from "../../../model/shared-models/chat-core/plugins/plugin-type-constants.data";
import { LifetimeContributorPriorityTypes } from "../../lifetime-contributor-priorities.enum";

export class UserMessagesIgnoredPlugin extends AgentPluginBase {
    readonly type = USER_MESSAGES_IGNORED_PLUGIN_TYPE_ID;
    agentUserManual?: string | undefined;

    priority: LifetimeContributorPriorityTypes = LifetimeContributorPriorityTypes.BeforeContextBuild;

    constructor(params: PluginInstanceReference | PluginSpecification) {
        super(params);
    }

    /**
     * Removes all user messages from the call messages before the chat call is made.
     */
    async modifyCallMessages?(messageHistory: BaseMessage[]): Promise<BaseMessage[]> {
        return messageHistory.filter(m => m.getType() !== 'human');
    }
}
