
/** Provides details about a BaseMessage, indicating who the speaker was.  This allows
 *   us to specifically reference an agent's ID, while using their name in the appropriate name
 *   property of the message.
 */
export interface MessageSpeaker {
    /** The type of speaker who created the message. */
    speakerType: 'user' | 'agent';
    /** The ObjectId, in string form, of the agent or user who created the message. */
    speakerId: string;
}

/** TypeGuard for the MessageSpeaker type. */
export function isMessageSpeaker(target: any): target is MessageSpeaker {
    return (
        typeof target === 'object' &&
        target !== null &&
        (target.speakerType === 'user' || target.speakerType === 'agent') &&
        typeof target.speakerId === 'string'
    );
}