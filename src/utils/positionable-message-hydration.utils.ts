import { BaseMessage, mapChatMessagesToStoredMessages, mapStoredMessagesToChatMessages, mapStoredMessageToChatMessage, StoredMessage } from "@langchain/core/messages";
import { PositionableMessage } from "../model/shared-models/chat-core/positionable-message.model";

/**
 * Converts a PositionableMessage containing a StoredMessage to one containing a BaseMessage.
 * @param message The PositionableMessage with a StoredMessage to hydrate.
 * @returns The hydrated PositionableMessage with a BaseMessage.
 */
export function hydratePositionableMessage(message: PositionableMessage<StoredMessage>): PositionableMessage<BaseMessage> {
    return { ...message, message: mapStoredMessageToChatMessage(message.message) };
}

/**
 * Converts a PositionableMessage containing a BaseMessage to one containing a StoredMessage.
 * @param message The PositionableMessage with a BaseMessage to dehydrate.
 * @returns The dehydrated PositionableMessage with a StoredMessage.
 */
export function dehydratePositionableMessage(message: PositionableMessage<BaseMessage>): PositionableMessage<StoredMessage> {
    return { ...message, message: mapChatMessagesToStoredMessages([message.message])[0] };
}

/**
 * Hydrates an array of PositionableMessages containing StoredMessages to BaseMessages.
 * @param messages The array of PositionableMessages with StoredMessages to hydrate.
 * @returns The hydrated array of PositionableMessages with BaseMessages.
 */
export function hydratePositionableMessages(messages: PositionableMessage<StoredMessage>[]): PositionableMessage<BaseMessage>[] {
    const newMessages = mapStoredMessagesToChatMessages(messages.map(m => m.message));
    return messages.map((m, i) => ({ ...m, message: newMessages[i] }));
}

/**
 * Dehydrates an array of PositionableMessages containing BaseMessages to StoredMessages.
 * @param messages The array of PositionableMessages with BaseMessages to dehydrate.
 * @returns The dehydrated array of PositionableMessages with StoredMessages.
 */
export function dehydratePositionableMessages(messages: PositionableMessage<BaseMessage>[]): PositionableMessage<StoredMessage>[] {
    const newMessages = mapChatMessagesToStoredMessages(messages.map(m => m.message));
    return messages.map((m, i) => ({ ...m, message: newMessages[i] }));
}

