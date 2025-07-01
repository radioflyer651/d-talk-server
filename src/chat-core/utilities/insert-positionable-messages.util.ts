import { BaseMessage } from "@langchain/core/messages";
import { MessagePositionTypes, PositionableMessage } from "../agent/model/positionable-message.model";

/** Inserts as set of PositionableMessage s into a specified set of BaseMessage s. */
export function insertPositionableMessages(positionableMessages: PositionableMessage[], messages: BaseMessage[]): BaseMessage[] {
    const organizer = new MessageOrganizer(messages, positionableMessages);
    return organizer.getMessageList();
}

/** Resposible for collecting positionable messages, and placing them in order. */
export class MessageOrganizer {
    constructor(
        public messageList: BaseMessage[],
        positionableMessages?: PositionableMessage[]
    ) {
        if (positionableMessages) {
            this.positionableMessages = positionableMessages;
        }
    }

    positionableMessages: PositionableMessage[] = [];

    getMessageList(): BaseMessage[] {
        const messages = this.messageList.slice();

        // Create "slots" to place messages in order, between the message list.
        const messageSlots: BaseMessage[][] = [];
        // We're creating a slot before each existing message, as well as
        //  one after the last message.
        for (let i = 0; i < messages.length + 1; i++) {
            messageSlots.push([]);
        }

        // Create slots for instructions, "first", and for the "Last" slots.
        const instructions: BaseMessage[] = [];
        const firstMessages: BaseMessage[] = [];
        const lastMessages: BaseMessage[] = [];

        // Place them in order.
        this.positionableMessages.forEach(m => {
            switch (m.location) {
                case MessagePositionTypes.AfterInstructions:
                    instructions.push(...m.messages);
                    break;
                case MessagePositionTypes.AfterAgentIdentity:
                    firstMessages.push(...m.messages);
                    break;
                case MessagePositionTypes.OffsetFromFront:
                    if (m.offset === undefined || m.offset === null) {
                        throw new Error(`Offset is required for OffsetFromFront location.`);
                    }
                    {
                        const idx = Math.min(Math.max(0, m.offset), messageSlots.length - 1);
                        messageSlots[idx].push(...m.messages);
                    }
                    break;
                case MessagePositionTypes.OffsetFromEnd:
                    if (m.offset === undefined || m.offset === null) {
                        throw new Error(`Offset is required for OffsetFromEnd location.`);
                    }
                    {
                        const idx = Math.max(0, messageSlots.length - 1 - m.offset);
                        messageSlots[idx].push(...m.messages);
                    }
                    break;
                case MessagePositionTypes.Last:
                    lastMessages.push(...m.messages);
                    break;
                default:
                    throw new Error(`Unknown message location: ${m.location}`);
            }
        });

        const returnMessages: BaseMessage[] = [
            ...instructions,
            ...firstMessages
        ];

        for (let i = 0; i < messages.length; i++) {
            returnMessages.push(...messageSlots[i]);
            returnMessages.push(messages[i]);
        }
        returnMessages.push(...messageSlots[messages.length]);
        returnMessages.push(...lastMessages);

        return returnMessages;
    }
}