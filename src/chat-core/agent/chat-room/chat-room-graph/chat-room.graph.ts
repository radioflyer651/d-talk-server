import { END, START, StateGraph } from '@langchain/langgraph';
import * as nodes from './chat-room.node';
import { ChatState } from './chat-room.state';
import { postChatReplyDecider } from './chat-room.conditionals';

// Create the LangGraph graph for the chat room node functions and IChatLifetimeContributor
export function createChatRoomGraph() {
    // The StateGraph expects the state definition directly, not wrapped in a 'channels' property.
    const graph = new StateGraph(ChatState);

    // Register nodes (functions) in the order of the chat lifecycle
    graph.addNode('chat-start', nodes.startChatCall)
        .addNode('initialize-lifetime', nodes.initializeLifetime)
        .addNode('pre-chat', nodes.preChat)
        .addNode('modify-call-messages', nodes.modifyCallMessages)
        .addNode('add-pre-chat-messages', nodes.addPreChatMessages)
        .addNode('chat-call', nodes.chatCall)
        .addNode('chat-complete', nodes.chatComplete)
        .addNode('handle-reply', nodes.handleReply)

        // Set the entry node and define the flow
        .addEdge(START, 'chat-start')
        .addEdge('chat-start', 'initialize-lifetime')
        .addEdge('initialize-lifetime', 'pre-chat')
        .addEdge('pre-chat', 'modify-call-messages')
        .addEdge('modify-call-messages', 'add-pre-chat-messages')
        .addEdge('add-pre-chat-messages', 'chat-call')
        .addConditionalEdges('handle-reply', postChatReplyDecider)
        .addEdge('chat-call', 'handle-reply')
        .addEdge('chat-complete', END);

    return graph;
}
