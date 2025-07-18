import { BaseMessage } from "@langchain/core/messages";
import { ChatMarkers, CustomChatFormatting } from "../model/shared-models/chat-core/model-service-params.model";


export function formatChatMessages(messages: BaseMessage[], formatting: CustomChatFormatting): string {
    let result = '';

    function formatMessage(delimters: ChatMarkers, messageContent: string) {
        return `${delimters.openDelimiter}${messageContent}${delimters.closeDelimiter}`;
    }

    messages.forEach(m => {
        switch (m.getType()) {
            case 'ai':
                result += formatMessage(formatting.aiMarkers, m.text);
                break;
            case 'human':
                result += formatMessage(formatting.userMarkers, m.text);
                break;
            case 'system':
                result += formatMessage(formatting.userMarkers, m.text);
                break;
            default:
            // Do nothing
        }
    });

    result += formatting.aiMarkers.openDelimiter;

    return result;
}