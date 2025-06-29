import { BaseMessage, AIMessage } from "@langchain/core/messages";
import { PositionableMessage } from "../model/positionable-message.model";
import { DynamicTool } from "@langchain/core/tools";

export interface IChatLifetimeContributor {
    /** Not part of the life-time, but when implemented, provides tools that may
     *   be called by the LLM. */
    getTools?(): Promise<DynamicTool[]>;

    initialize?(): Promise<void>;

    preChat?(callMessages: BaseMessage[]): Promise<void>;

    modifyCallMessages?(messageHistory: BaseMessage[]): Promise<BaseMessage[]>;

    addPreChatMessages?(info: ChatCallInfo): Promise<PositionableMessage[]>;

    // Chat occurs.

    handleReply?(reply: AIMessage): Promise<undefined | PositionableMessage[]>;

    chatComplete?(finalMessages: BaseMessage[]): Promise<void>;
}

export interface ChatCallInfo {
    replyNumber: number;
}
