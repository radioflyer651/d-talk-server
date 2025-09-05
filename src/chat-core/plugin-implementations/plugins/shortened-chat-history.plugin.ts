import { BaseMessage } from "@langchain/core/messages";
import { AgentPluginBase } from "../../agent-plugin/agent-plugin-base.service";
import { PluginInstanceReference } from "../../../model/shared-models/chat-core/plugin-instance-reference.model";
import { PluginSpecification } from "../../../model/shared-models/chat-core/plugin-specification.model";
import { LifetimeContributorPriorityTypes } from "../../lifetime-contributor-priorities.enum";
import { ShortenedChatHistoryPluginConfig } from "../../../model/shared-models/chat-core/plugins/shortened-chat-history-plugin-config.model";
import { SHORTENED_CHAT_HISTORY_PLUGIN_TYPE_ID } from "../../../model/shared-models/chat-core/plugins/plugin-type-constants.data";

export class ShortenedChatHistoryPlugin extends AgentPluginBase {
    readonly type: string = SHORTENED_CHAT_HISTORY_PLUGIN_TYPE_ID;
    agentUserManual?: string =
        "This plugin limits the number of permanent chat history messages sent to the LLM. Only the most recent N messages are kept, where N is configurable.";
    priority: LifetimeContributorPriorityTypes = LifetimeContributorPriorityTypes.MessageReducers;

    constructor(params: PluginInstanceReference<ShortenedChatHistoryPluginConfig> | PluginSpecification<ShortenedChatHistoryPluginConfig>) {
        super(params);
    }

    declare specification: PluginSpecification<ShortenedChatHistoryPluginConfig>;

    async modifyCallMessages(messageHistory: BaseMessage[]): Promise<BaseMessage[]> {
        // Only keep the most recent N permanent messages (not pre/post added by other plugins)
        const config: ShortenedChatHistoryPluginConfig = this.specification.configuration ?? { maxCharacters: 40000 };
        const maxCharacters: number = config.maxCharacters ?? 40000;

        if (!Array.isArray(messageHistory) || messageHistory.length === 0) {
            return messageHistory;
        }

        // Start from the end, accumulate messages until maxCharacters is reached.
        let runningTotal = 0;
        const selected: typeof messageHistory = [];
        for (let i = messageHistory.length - 1; i >= 0; i--) {
            // Get the current message.
            const msg = messageHistory[i];

            // Try to get the text content of the message.
            let text = '';
            if ('text' in msg && typeof msg.text === 'string') {
                text = msg.text;
            } else if ('content' in msg && typeof msg.content === 'string') {
                text = msg.content;
            } else if (typeof msg.toString === 'function') {
                text = msg.toString();
            }

            runningTotal += text.length;

            if (runningTotal > maxCharacters) {
                break;
            }

            selected.unshift(msg);
        }
        return selected;
    }
}
