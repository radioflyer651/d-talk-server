import { ObjectId } from "mongodb";
import { IChatRoomEvent } from "./chat-room-event.model";
import { BaseMessage } from "@langchain/core/messages";
import { MessageChunkMessage } from "./socket-messaging/message-chunk-message.socket-model";


export interface ChatRoomMessageEvent extends IChatRoomEvent {
    chatRoomId: ObjectId;
    eventType: 'new-chat-message';
    agentType: 'agent' | 'user';
    agentId: ObjectId;
    dateTime: Date;
    message: BaseMessage;
    messageId: string;
}

export interface ChatRoomMessageChunkEvent extends IChatRoomEvent, MessageChunkMessage {
    eventType: 'new-chat-message-chunk';

}