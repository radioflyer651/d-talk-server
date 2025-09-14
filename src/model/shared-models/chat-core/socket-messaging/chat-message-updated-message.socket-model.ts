import { StoredMessage } from "@langchain/core/messages";

export const MESSAGE_UPDATED_MESSAGE = 'message-updated';

/** Sent when a chat message has been updated. */
export interface ChatMessageUpdatedMessage {
    chatRoomId: string;
    message: StoredMessage;
}