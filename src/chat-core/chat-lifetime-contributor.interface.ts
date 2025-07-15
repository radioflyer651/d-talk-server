import { BaseMessage, AIMessage } from "@langchain/core/messages";
import { PositionableMessage } from "../model/shared-models/chat-core/positionable-message.model";
import { DynamicTool, StructuredToolInterface, Tool } from "@langchain/core/tools";
import { ToolNode } from "@langchain/langgraph/dist/prebuilt/tool_node";

export interface IChatLifetimeContributor {

    /** Higher priorities have actions occur closer to the LLM chat call, and lower numbers
     *   occur prior to the chat call. */
    priority?: number;

    /**
     * Not part of the life-time, but when implemented, provides tools that may
     * be called by the LLM during the chat session.
     */
    getTools?(): Promise<(ToolNode | StructuredToolInterface)[]>;

    /**
     * Called once at the start of the chat session to allow the contributor to initialize any state or resources.
     */
    initialize?(): Promise<void>;

    /**
     * Called before the chat begins, allowing the contributor to process or inspect the initial call messages.
     */
    preChat?(callMessages: BaseMessage[]): Promise<void>;

    /**
     * Allows the contributor to modify the message history before the chat call is made.
     * Should return the updated list of messages.
     */
    modifyCallMessages?(messageHistory: BaseMessage[]): Promise<BaseMessage[]>;

    /**
     * Allows the contributor to add messages before the chat call is made (e.g., system or context messages).
     * Returns an array of messages to prepend to the call.
     */
    addPreChatMessages?(info: ChatCallInfo): Promise<PositionableMessage<BaseMessage>[]>;

    /** Provides the opportunity to inspect chat messages before the actual chat call is made. */
    inspectChatCallMessages?(callMessages: BaseMessage[], chatHistory: BaseMessage[]): Promise<void>;

    // Chat occurs here

    /**
     * Called after the chat model generates a reply, allowing the contributor to process the reply
     * and optionally return additional messages to insert.
     */
    handleReply?(reply: AIMessage): Promise<undefined | PositionableMessage<BaseMessage>[]>;

    /** Called after any tools are executed, and passes the message histories. */
    peekToolCallMessages?(messageHistory: BaseMessage[], callMessages: BaseMessage[], newMessages: BaseMessage[]): Promise<void>;

    /**
     * Called at the end of the chat session, allowing the contributor to finalize or clean up resources.
     */
    chatComplete?(finalMessages: BaseMessage[], newMessages: BaseMessage[]): Promise<void>;
}

export interface ChatCallInfo {
    replyNumber: number;
    callMessages: BaseMessage[];
    messageHistory: BaseMessage[];
}
