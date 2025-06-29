import { IChatRoomEvent } from "./chat-room-event.model";

export interface ChatRoomBusyStateEvent extends IChatRoomEvent {
    eventType: 'chat-room-busy-status-changed';
    newValue: boolean;
}