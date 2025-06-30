import { AIMessage, ChatMessage } from "@langchain/core/messages";
import { ChatState } from "./chat-room.state";


export async function postChatReplyDecider(state: typeof ChatState.State) {
    if (state.makeReplyCall) {
        return 'chat-call';
    }

    return 'chat-complete';
}

export async function shouldCallToolsDecider(state: typeof ChatState.State) {
    const aiMessage = state.messageHistory[state.messageHistory.length - 1] as AIMessage;

    if (aiMessage.tool_calls) {
        return 'call-tools';
    }

    return 'handle-reply';
}