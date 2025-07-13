import { ObjectId } from "mongodb";


export const ENTER_CHAT_ROOM = 'entered-chat-room';
export const EXIT_CHAT_ROOM = 'exited-chat-room';

export interface EnterChatRoomMessage {
    roomId: ObjectId;
}

export interface ExitChatRoomMessage {
    roomId: ObjectId;
}

/** Returns the SocketIO room name for a ChatRoom, specified by its ID. */
export function getChatRoomRoomName(roomId: ObjectId) {
    return `chat-room-${roomId.toString()}`;
}