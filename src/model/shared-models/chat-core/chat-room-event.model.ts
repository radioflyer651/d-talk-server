
export type ChatRoomEventTypes =
    'new-chat-message'
    | 'new-chat-message-chunk'
    | 'message-updated'
    | 'chat-room-busy-status-changed';

export interface IChatRoomEvent {
    readonly eventType: ChatRoomEventTypes;
}
