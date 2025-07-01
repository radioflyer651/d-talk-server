import { BaseMessage, AIMessage } from "@langchain/core/messages";
import { PositionableMessage } from "./agent/model/positionable-message.model";
import { DynamicTool } from "@langchain/core/tools";

export interface IChatLifetimeContributor {
    /**
     * Not part of the life-time, but when implemented, provides tools that may
     * be called by the LLM during the chat session.
     */
    getTools?(): Promise<DynamicTool[]>;

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
    addPreChatMessages?(info: ChatCallInfo): Promise<PositionableMessage[]>;

    // Chat occurs here

    /**
     * Called after the chat model generates a reply, allowing the contributor to process the reply
     * and optionally return additional messages to insert.
     */
    handleReply?(reply: AIMessage): Promise<undefined | PositionableMessage[]>;

    /** Called after any tools are executed, and passes the message histories. */
    peekToolCallMessages?(messageHistory: BaseMessage[], messageCalls: BaseMessage[], newMessages: BaseMessage[]): Promise<void>;

    /**
     * Called at the end of the chat session, allowing the contributor to finalize or clean up resources.
     */
    chatComplete?(finalMessages: BaseMessage[], newMessages: BaseMessage[]): Promise<void>;
}

export interface ChatCallInfo {
    replyNumber: number;
}
