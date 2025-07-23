import { StructuredToolInterface } from "@langchain/core/tools";
import { Annotation, MessagesAnnotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { LabeledMemoryPluginParams } from "../../../../model/shared-models/chat-core/plugins/labeled-memory-plugin.params";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { MongoDbStore } from "../../../../services/lang-chain/mongo-store.service";
import { BaseMessage } from "@langchain/core/messages";

/** Enumerates the types of operations the LLM can perform with Labeled Memory. */
export type LabeledMemoryMessageOperationTypes = 'retrieve' | 'store' | 'maintain';

export const LabeledMemoryPluginState = Annotation.Root({
    ...MessagesAnnotation.spec,
    originalChatHistory: Annotation<BaseMessage[]>,
    tools: Annotation<(ToolNode | StructuredToolInterface)[]>,
    memoryParams: Annotation<LabeledMemoryPluginParams>,
    chatModel: Annotation<BaseChatModel>,
    operationType: Annotation<LabeledMemoryMessageOperationTypes>,
    store: Annotation<MongoDbStore>,
    resultingMemoryMessages: Annotation<BaseMessage[]>,
    toolCallCount: Annotation<number>,
    toolCallCountLimit: Annotation<number>,
    logStepsToConsole: Annotation<boolean | undefined>,
});