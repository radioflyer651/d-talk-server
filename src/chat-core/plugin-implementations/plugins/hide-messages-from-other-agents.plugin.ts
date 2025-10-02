import { BaseMessage } from "@langchain/core/messages";
import { AgentPluginBase } from "../../agent-plugin/agent-plugin-base.service";
import { HIDE_MESSAGES_FROM_OTHER_AGENTS_PLUGIN_TYPE_ID } from "../../../model/shared-models/chat-core/plugins/plugin-type-constants.data";
import { PluginInstanceReference } from "../../../model/shared-models/chat-core/plugin-instance-reference.model";
import { PluginSpecification } from "../../../model/shared-models/chat-core/plugin-specification.model";
import { copyBaseMessages } from "../../../utils/copy-base-message.utils";
import { getSpeakerFromMessage, getVisibleOnlyToAgent, setVisibleOnlyToAgent } from "../../../model/shared-models/chat-core/utils/messages.utils";
import { LifetimeContributorPriorityTypes } from "../../lifetime-contributor-priorities.enum";
import { ObjectId } from "mongodb";

/**
 * Plugin that hides messages from other agents in the chat history.
 * When this plugin is active, the agent will only see its own messages and user messages,
 * but not messages from other agents in the room.  */
export class HideMessagesFromOtherAgentsPlugin extends AgentPluginBase {
    readonly type: string = HIDE_MESSAGES_FROM_OTHER_AGENTS_PLUGIN_TYPE_ID;
    agentUserManual?: string | undefined;

    priority: LifetimeContributorPriorityTypes = LifetimeContributorPriorityTypes.BeforeContextBuild;

    declare specification: PluginSpecification<undefined>;

    constructor(params: PluginInstanceReference<undefined> | PluginSpecification<undefined>) {
        super(params);
    }

    async chatComplete?(finalMessages: BaseMessage[], newMessages: BaseMessage[]): Promise<void> {
        // Get the agent's ID.
        const agentId = this.agent.data._id;

        // Set a marker so other agents can't see this message.
        newMessages.forEach(m => {
            setVisibleOnlyToAgent(m, agentId.toHexString());
        });
    }

    /** This must be called by the chatroom, because it has to be called on messages for ALL chat requests.
     *   Not just requests with this plugin on it. */
    static modifyCallMessages_External(currentAgentId: ObjectId, messageHistory: BaseMessage[]): BaseMessage[] {
        // Get the string form of the agent's ID.
        const agentId = currentAgentId.toHexString();

        // Remove any message that is visible only to another agent.
        return messageHistory.filter(m => {
            // Get the visibility setting.
            const visibleOnlyToAgent = getVisibleOnlyToAgent(m);

            // If it's not undefined or not this agent's id, then boot it.
            return !visibleOnlyToAgent || agentId === visibleOnlyToAgent;
        });
    }
}