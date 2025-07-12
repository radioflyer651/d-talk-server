import { ChatRoomData } from "../../model/shared-models/chat-core/chat-room-data.model";
import { ChatRoom } from "./chat-room.service";


export interface IChatRoomHydratorService {

    /** Given a specified chat room data set, returns a new chat room instance. */
    hydrateChatRoom(chatRoomData: ChatRoomData): Promise<ChatRoom>;
}