import { END, START, StateGraph } from "@langchain/langgraph";
import { LabeledMemoryPluginState } from "./labeled-plugin-memory-plugin.state";
import * as nodes from './labeled-plugin-memory-plugin.nodes';


export function getLabeledMemoryPluginGraph() {
    const graph = new StateGraph(LabeledMemoryPluginState);

    graph.addNode('initialize', nodes.initializeCall)
        .addNode(`call-tools`, nodes.callTools)
        .addNode(`summarize-results`, nodes.summarizeMemoryData)
        .addNode('call-memory-model', nodes.performMemoryCall)
        .addNode(`add-memory-instructions`, nodes.addMemoryInstructions)

        .addEdge(START, 'initialize')
        .addEdge('initialize', `add-memory-instructions`)
        .addEdge(`add-memory-instructions`, `call-memory-model`)
        .addEdge(`call-tools`, `call-memory-model`)
        .addConditionalEdges(`call-memory-model`, nodes.isMemoryOperationsCompleteDecider)
        .addEdge(`summarize-results`, END);

    return graph.compile();
}