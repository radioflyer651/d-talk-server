import { ChatState } from "./chat-room.state";


export async function postChatReplyDecider(state: typeof ChatState.State) {
    if (state.makeReplyCall) {
        return 'chat-call';
    }

    return 'chat-complete';
}