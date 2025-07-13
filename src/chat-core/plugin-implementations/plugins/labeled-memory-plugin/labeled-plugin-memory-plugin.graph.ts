import { END, START, StateGraph } from "@langchain/langgraph";
import { LabeledMemoryPluginState } from "./labeled-plugin-memory-plugin.state";
import * as nodes from './labeled-plugin-memory-plugin.nodes';


export function getLabeledMemoryPluginGraph() {
    const graph = new StateGraph(LabeledMemoryPluginState);

    graph.addNode('t_initialize', nodes.initializeCall)
        .addNode(`t_call-tools`, nodes.callTools)
        .addNode(`t_summarize-results`, nodes.summarizeMemoryData)
        .addNode('t_call-memory-model', nodes.performMemoryCall)
        .addNode(`t_add-memory-instructions`, nodes.addMemoryInstructions)

        .addEdge(START, 't_initialize')
        .addEdge('t_initialize', `t_add-memory-instructions`)
        .addEdge(`t_add-memory-instructions`, `t_call-memory-model`)
        .addEdge(`t_call-tools`, `t_call-memory-model`)
        .addConditionalEdges(`t_call-memory-model`, nodes.isMemoryOperationsCompleteDecider)
        .addEdge(`t_summarize-results`, END);

    return graph.compile();
}