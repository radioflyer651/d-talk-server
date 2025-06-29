import { BaseMessage } from "@langchain/core/messages";
import { MessagePositionTypes, PositionableMessage } from "../agent/model/positionable-message.model";

function insertAbsoluteFirst(messages: BaseMessage[], toInsert: BaseMessage[]): BaseMessage[] {
    return [...toInsert, ...messages];
}

function insertAfterAgentIdentity(messages: BaseMessage[], toInsert: BaseMessage[]): BaseMessage[] {
    // Find the last system message (assuming agent identity is a system message)
    // Fallback: insert after the first message
    const idx = messages.findIndex(m => (m as any).role !== undefined && (m as any).role === 'system');
    if (idx === -1) {
        return [...toInsert, ...messages];
    }
    return [
        ...messages.slice(0, idx + 1),
        ...toInsert,
        ...messages.slice(idx + 1)
    ];
}

function insertOffsetFromFront(messages: BaseMessage[], toInsert: BaseMessage[], offset: number = 0): BaseMessage[] {
    const idx = Math.min(Math.max(0, offset), messages.length);
    return [
        ...messages.slice(0, idx),
        ...toInsert,
        ...messages.slice(idx)
    ];
}

function insertOffsetFromEnd(messages: BaseMessage[], toInsert: BaseMessage[], offset: number = 0): BaseMessage[] {
    const idx = Math.max(0, messages.length - offset);
    return [
        ...messages.slice(0, idx),
        ...toInsert,
        ...messages.slice(idx)
    ];
}

function insertLast(messages: BaseMessage[], toInsert: BaseMessage[]): BaseMessage[] {
    return [...messages, ...toInsert];
}

export function insertPositionableMessage(message: PositionableMessage, messages: BaseMessage[]): BaseMessage[] {
    switch (message.location) {
        case MessagePositionTypes.AbsoluteFirst:
            return insertAbsoluteFirst(messages, message.messages);
        case MessagePositionTypes.AfterAgentIdentity:
            return insertAfterAgentIdentity(messages, message.messages);
        case MessagePositionTypes.OffsetFromFront:
            return insertOffsetFromFront(messages, message.messages, message.offset ?? 0);
        case MessagePositionTypes.OffsetFromEnd:
            return insertOffsetFromEnd(messages, message.messages, message.offset ?? 0);
        case MessagePositionTypes.Last:
            return insertLast(messages, message.messages);
        default:
            throw new Error(`Unknown message location: ${message.location}`);
    }
}

/** Inserts as set of PositionableMessage s into a specified set of BaseMessage s. */
export function insertPositionableMessages(positionableMessages: PositionableMessage[], messages: BaseMessage[]): BaseMessage[] {
    return positionableMessages.reduce((p, m) =>
        insertPositionableMessage(m, p), messages);
}