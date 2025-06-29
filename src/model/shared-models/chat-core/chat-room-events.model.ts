import { ObjectId } from "mongodb";
import { IChatRoomEvent } from "./chat-room-event.model";


export interface ChatRoomMessageEvent extends IChatRoomEvent {
    chatRoomId: ObjectId;
    eventType: 'chat-message';
    agentType: 'agent' | 'user';
    agentId: ObjectId;
    dateTime: Date;
    message: string;
}