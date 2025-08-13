import { BaseMessage, StoredMessage } from "@langchain/core/messages";
import { isMessageSpeaker, MessageSpeaker } from "../message-speaker.model";
import { ApplicationMessageInfo } from "../application-message-info.model";

export const MESSAGE_SPEAKER_KEY = 'dtalk_speaker';
export const DTALK_PARAMS_KEY = 'dtalk_params';

function isStoredMessage(target: any): target is StoredMessage {
    return typeof target === 'object' && 'data' in target;
}

function getKwargs(message: StoredMessage | BaseMessage): Record<string, any> {
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