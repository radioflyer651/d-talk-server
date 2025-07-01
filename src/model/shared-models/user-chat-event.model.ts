import { ObjectId } from "mongodb";


export interface UserChatEventData {
    chatRoomId: ObjectId;
    message: string;
}

export type UserChatEventArgs = [
    ObjectId,
    string,
];
