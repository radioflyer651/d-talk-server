import { BaseMessage, StoredMessage } from "@langchain/core/messages";
import { isMessageSpeaker, MessageSpeaker } from "../message-speaker.model";
import { ApplicationMessageInfo } from "../application-message-info.model";
import { ObjectId } from "mongodb";

export const MESSAGE_SPEAKER_KEY = 'dtalk_speaker';
export const DTALK_PARAMS_KEY = 'dtalk_params';
export const MESSAGE_SOURCE_KEY = 'message-source';
export const MESSAGE_VOICE_CHAT_ID_KEY = 'message_voice_chat_id';
export const MESSAGE_VOICE_CHAT_URL_KEY = 'message_voice_chat_url';
export const MESSAGE_TASK_ID_KEY = 'message_task_id';
export const MESSAGE_ID_KEY = 'id';

function isStoredMessage(target: any): target is StoredMessage {
    return typeof target === 'object' && 'data' in target;
}

/** Returns the additional_kwargs property from a BaseMessage or StoredMessage. */
export function getKwargs(message: StoredMessage | BaseMessage): Record<string, any> {
    let additional_kwargs: Record<string, any>;

    if (isStoredMessage(message)) {
        if (!message.data.additional_kwargs) {
            message.data.additional_kwargs = {};
        }

        additional_kwargs = message.data.additional_kwargs;

    } else {
        // Convert to any for the client-side.
        additional_kwargs = (message as any).additional_kwargs;
    }

    return additional_kwargs;
}

/** Attempts to retrieve the speaker data for a specified message. */
export function getSpeakerFromMessage(message: StoredMessage | BaseMessage): MessageSpeaker | undefined {
    const additional_kwargs = getKwargs(message);

    // Get the data dictinoary.
    const args = additional_kwargs;

    // Get the item from teh data dictionary.
    const result = args[MESSAGE_SPEAKER_KEY];

    // Validate it.
    if (!isMessageSpeaker(result)) {
        return undefined;
    }

    // Return the result.
    return result;
}

export function getSpeakerFromStoredMessage(message: StoredMessage): MessageSpeaker | undefined {
    // Get the data dictinoary.
    const args = message.data.additional_kwargs ?? {};

    // Get the item from teh data dictionary.
    const result = args[MESSAGE_SPEAKER_KEY];

    // Validate it.
    if (!isMessageSpeaker(result)) {
        return undefined;
    }

    // Return the result.
    return result;
}

/** Sets the speaker data for a specified message. */
export function setSpeakerOnMessage(message: BaseMessage | StoredMessage, speaker: MessageSpeaker): void {
    const additional_kwargs = getKwargs(message);
    additional_kwargs[MESSAGE_SPEAKER_KEY] = speaker;
}

/** Returns application-specific data stored on the message. */
export function getDtalkParams(message: BaseMessage | StoredMessage): ApplicationMessageInfo {
    const additional_kwargs = getKwargs(message);
    if (!additional_kwargs[DTALK_PARAMS_KEY]) {
        additional_kwargs[DTALK_PARAMS_KEY] = {};
    }

    return additional_kwargs[DTALK_PARAMS_KEY];
}

/** Returns a boolean value indicating whether or not a specified message is disabled (and not used in chat calls). */
export function isMessageDisabled(message: BaseMessage | StoredMessage): boolean {
    const params = getDtalkParams(message);
    return !!params.disabled;
}

/** Sets the disabled property on a specified message, removing it from LLM calls during the chat process. */
export function setMessageDisabledValue(message: BaseMessage | StoredMessage, newVal: boolean) {
    const params = getDtalkParams(message);
    params.disabled = newVal;
}

/** Returns the date/time that a specified message was created, if it was stored on the message. */
export function getMessageDateTime(message: BaseMessage | StoredMessage): Date | undefined {
    // Get the params.
    const params = getDtalkParams(message);

    // Can't do much if the value is missing.
    if (!params.dateTime) {
        return undefined;
    }

    // Return the converted value.
    try {
        return new Date(params.dateTime);
    } catch (err) {
        return undefined;
    }
}

/** Sets the date/time on a specified message. */
export function setMessageDateTime(message: BaseMessage | StoredMessage, dateTime: Date) {
    // Get the parameters.
    const params = getDtalkParams(message);

    // Set the date/time value.
    params.dateTime = dateTime.toISOString();
}

/** Sets the date/time on a specifed message if it doesn't already have one. */
export function setMessageDateTimeIfMissing(message: BaseMessage | StoredMessage, dateTime: Date) {
    if (!getMessageDateTime(message)) {
        setMessageDateTime(message, dateTime);
    }
}

/** Enumerates the sources that a message can come from. */
export type MessageSourceTypes =
    'project' |
    'chat-room' |
    'job' |
    'agent-instructions' |
    'agent-identity' |
    'plugin';

/** Given a specified message, returns the source that the message was generated from.
 *   NOTE: This method is meant for server-side only.
 */
export function getMessageSource(message: BaseMessage | StoredMessage): MessageSourceTypes | undefined {
    // Get the data.
    const data = getKwargs(message);

    // Return the value.
    return data[MESSAGE_SOURCE_KEY];
}

/** Sets the message source type of a specified message.
 *   NOTE: This method is meant for server-side use.
 */
export function setMessageSource(message: BaseMessage | StoredMessage, type: MessageSourceTypes) {
    // Get the data.
    const data = getKwargs(message);

    // Set the value.
    data[MESSAGE_SOURCE_KEY] = type;
}

/** Returns the ID of the voice message for a specified chat message. */
export function getMessageVoiceId(message: BaseMessage | StoredMessage): ObjectId {
    // Get the data.
    const data = getKwargs(message);

    // Set the value.
    return data[MESSAGE_VOICE_CHAT_ID_KEY];

}

/** Sets the ID of the voice message for a specified chat message. */
export function setMessageVoiceId(message: BaseMessage | StoredMessage, voiceMessageId: ObjectId) {
    // Get the data.
    const data = getKwargs(message);

    // Set the value.
    data[MESSAGE_VOICE_CHAT_ID_KEY] = voiceMessageId;

}

/** Returns the task ID for a specified chat message. */
export function getMessageTaskId(message: BaseMessage | StoredMessage): string | undefined {
    // Get the data.
    const data = getKwargs(message);

    // Return the value.
    return data[MESSAGE_TASK_ID_KEY];
}

/** Sets the task ID for a specified chat message. */
export function setMessageTaskId(message: BaseMessage | StoredMessage, taskId: ObjectId | string | undefined) {
    // Recast to a string.
    let stringId: string | undefined;
    if (typeof taskId === 'object' && 'toHexString' in taskId) {
        stringId = (taskId as any)['toHexString']();
    } else if (typeof taskId === 'string') {
        stringId = taskId;
    } else {
        if (taskId !== undefined) {
            throw new Error(`Unexpected type of taskId.`);
        }
    }

    // Get the data.
    const data = getKwargs(message);

    // Set the value.
    data[MESSAGE_TASK_ID_KEY] = stringId;
}

/** Returns the Voice Message URL for a specified chat message. */
export function getMessageVoiceUrl(message: BaseMessage | StoredMessage): string | undefined {
    // Get the data.
    const data = getKwargs(message);
    return data[MESSAGE_VOICE_CHAT_URL_KEY];
}

/** Sets the Voice Message URL for a specified chat message. */
export function setMessageVoiceUrl(message: BaseMessage | StoredMessage, voiceMessageUrl: string | undefined) {
    // Get the data.
    const data = getKwargs(message);
    data[MESSAGE_VOICE_CHAT_URL_KEY] = voiceMessageUrl;
}

/** Returns the ID of a message, either stored on the message's data itself, or in its additional_kwargs property. */
export function getMessageId(message: BaseMessage | StoredMessage): string | undefined {
    if (isStoredMessage(message)) {
        if (message.data.id) {
            return message.data.id;
        }
    } else {
        // Conversion to any for client-side.
        if ((message as any).id) {
            return (message as any).id;
        }
    }

    // There's no attached ID.  Check the kwargs.
    const data = getKwargs(message);

    // Return the value, whether it set or not.
    return data[MESSAGE_ID_KEY];
}

/** Sets the ID of a message in the additional_kwargs, but does NOT change the id of the message itself (which may or may not exist - and takes precedent). */
export function setMessageId(message: BaseMessage | StoredMessage, newId: string, errorOnIdExists = true) {
    if (errorOnIdExists) {
        let foundId: string | undefined;
        if (isStoredMessage(message)) {
            foundId = message.data.id;
        } else {
            // Conversion to any for client-side.
            foundId = (message as any).id;
        }

        if (foundId) {
            throw new Error(`Message already has an id, and cannot be set.`);
        }
    }

    // Set the value.
    const data = getKwargs(message);
    data[MESSAGE_ID_KEY] = newId;
}