import { ChatState } from "./chat-room.state";


export async function postChatReplyDecider(state: typeof ChatState.State) {
    if (state.makeReplyCall) {
        return 'chat-call';
    }

    // A plugin (e.g. PromptToolCallingPlugin) may have synthesized tool_calls onto the last
    // AI message during handleReply. Route to call-tools if present.
    // Use duck-typing rather than instanceof — chatCall produces AIMessageChunk, not AIMessage.
    const lastMsg = state.messageHistory[state.messageHistory.length - 1];
    const toolCalls = (lastMsg as any)?.tool_calls;
    if (toolCalls && toolCalls.length > 0) {
        return 'call-tools';
    }

    return 'chat-complete';
}

export async function shouldCallToolsDecider(state: typeof ChatState.State) {
    // Use duck-typing rather than instanceof — chatCall produces AIMessageChunk, not AIMessage.
    const lastMsg = state.messageHistory[state.messageHistory.length - 1];
    const toolCalls = (lastMsg as any)?.tool_calls;

    if (toolCalls && toolCalls.length > 0) {
        return 'call-tools';
    }

    return 'handle-reply';
}
