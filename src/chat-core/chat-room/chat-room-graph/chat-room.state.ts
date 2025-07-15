import { BaseMessage } from "@langchain/core/messages";
import { Annotation } from "@langchain/langgraph";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { DynamicTool, StructuredToolInterface } from "@langchain/core/tools";
import { IChatLifetimeContributor } from "../../chat-lifetime-contributor.interface";
import { ToolNode } from "@langchain/langgraph/prebuilt";


export const ChatState = Annotation.Root({
    /** Messages that will be retained for the history.  not all callMessages should be retained. */
    messageHistory: Annotation<BaseMessage[]>,
    /** Messages that will be used in the upcoming chat call. */
    callMessages: Annotation<BaseMessage[]>,
    /** Entities that controbute to the lifetime of a chat call. */
    lifetimeContributors: Annotation<IChatLifetimeContributor[]>,
    /** Boolean value indicating whether or not a reply call needs to be made, because
     *   one of the lifetime contributors needs the LLM to reprocess with its new messages. */
    makeReplyCall: Annotation<boolean>,
    /** The number of replies that have been made so far. */
    replyCount: Annotation<number>,
    /** The chat model that LLM calls will be made with. */
    chatModel: Annotation<BaseChatModel>,
    /** All tools that are available to be called for an agent. */
    tools: Annotation<(ToolNode | StructuredToolInterface)[]>,
    /** A set of messages that were added to the chat history during this graph execution. */
    newMessages: Annotation<BaseMessage[]>,
    /** Boolean value indicating whether or not to log node actions to the console, as they happen. */
    logStepsToConsole: Annotation<boolean>,
});

export const ChatCallState = Annotation.Root({
    /** The message history that the next chat call will be made with.  This should include
     *   the most recent user-message, which would presumably kick off the chat interaction. */
    messageHistory: Annotation<BaseMessage[]>,
    /** Entities that controbute to the lifetime of a chat call. */
    lifetimeContributors: Annotation<IChatLifetimeContributor[]>,
    /** The chat model that LLM calls will be made with. */
    chatModel: Annotation<BaseChatModel>,
    /** Boolean value indicating whether or not to log node actions to the console, as they happen. */
    logStepsToConsole: Annotation<boolean>,
});