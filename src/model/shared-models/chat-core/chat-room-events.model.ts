import { ObjectId } from "mongodb";
import { IChatRoomEvent } from "./chat-room-event.model";
import { BaseMessage } from "@langchain/core/messages";


export interface ChatRoomMessageEvent extends IChatRoomEvent {
    chatRoomId: ObjectId;
    eventType: 'new-chat-message';
    agentType: 'agent' | 'user';
    agentId: ObjectId;
    dateTime: Date;
    message: BaseMessage;
    messageId: string;
}
