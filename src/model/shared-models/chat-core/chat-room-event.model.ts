
export type ChatRoomEventTypes =
    'new-chat-message'
    | 'new-chat-message-chunk'
    | 'chat-room-busy-status-changed';

export interface IChatRoomEvent {
    readonly eventType: ChatRoomEventTypes;
}
