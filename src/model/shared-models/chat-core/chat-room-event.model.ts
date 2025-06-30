
export type ChatRoomEventTypes =
    'new-chat-message'
    | 'chat-room-busy-status-changed';

export interface IChatRoomEvent {
    readonly eventType: ChatRoomEventTypes;
}
