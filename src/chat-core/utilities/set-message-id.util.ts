import { BaseMessage } from "@langchain/core/messages";
import { ObjectId } from "mongodb";

/** Returns a unique string ID used for BaseMessage objects. */
export function getIdForMessage(): string {
    return new ObjectId().toString();
}

/** If a specified BaseMessage does not have an id value, sets the value. */
export function setMessageId(message: BaseMessage): void {
    if (!message.id) {
        message.id = getIdForMessage();
    }
}

/** Ensures that all messages in a specified BaseMessage array have their id properties set, if they are not set. */
export function setMessageIds(messages: BaseMessage[]): void {
    messages.forEach(m => setMessageId(m));
}