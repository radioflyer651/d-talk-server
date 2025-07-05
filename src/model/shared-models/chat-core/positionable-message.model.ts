
/** Enumerates the locations that plugin messages can be placed within a chat message history. */
export enum MessagePositionTypes {
    Instructions = 'instructions',
    /** Indicates the message should be inserted after agent system messages. */
    AfterAgentIdentity = 'after-identity',
    /** Indicates that the message should be as close to the beginning as possible. */
    AfterInstructions = 'after-instructions',
    /** Indicates the instructions should be inserted at some offset from after the user instructions. */
    OffsetFromFront = 'offset-from-front',
    /** Indicates the instructions should be inserted at some offset before the last message. */
    OffsetFromEnd = 'offset-from-end',
    /** Indicates the message should be inserted last in the message list. */
    Last = 'last'
}

/** Represents a message to be provided, during execution, in the chat history for an agent.
 *   This message would not be persisted in the history. */
export interface PositionableMessage<T> {
    /** The location to place the message. */
    location: MessagePositionTypes;

    /** The messages to be added to the chat history. */
    message: T;

    /** Optional offset for OffsetFromFront and OffsetFromEnd positioning. */
    offset?: number;
}