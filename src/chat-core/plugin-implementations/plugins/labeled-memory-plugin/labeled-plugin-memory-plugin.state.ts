import { StructuredToolInterface } from "@langchain/core/tools";
import { Annotation, MessagesAnnotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { LabeledMemoryPluginParams } from "../../../../model/shared-models/chat-core/plugins/labeled-memory-plugin.params";
import { BaseChatModel, BindToolsInput } from "@langchain/core/language_models/chat_models";

/** Enumerates the types of operations the LLM can perform with Labeled Memory. */
export type LabeledMemoryMessageOperationTypes = 'retrieve' | 'store' | 'maintain';

export const LabeledMemoryPluginState = Annotation.Root({
    ...MessagesAnnotation.spec,
    tools: Annotation<BindToolsInput[]>,
    memoryParams: Annotation<LabeledMemoryPluginParams>,
    chatModel: Annotation<BaseChatModel>,
    operationType: Annotation<LabeledMemoryMessageOperationTypes>,
});