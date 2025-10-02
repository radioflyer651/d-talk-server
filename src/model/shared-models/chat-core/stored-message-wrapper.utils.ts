import { StoredMessage } from "@langchain/core/messages";
import { StoredMessageAgentTypes } from "./stored-message-agent-types.data";
import { getDtalkParams, getMessageTaskId, getSpeakerFromStoredMessage, MESSAGE_SPEAKER_KEY, setMessageTaskId } from "./utils/messages.utils";
import { ObjectId } from "mongodb";

export class StoredMessageWrapper {
    constructor(
        message?: StoredMessage
    ) {
        if (message) {
            this.message = message;
        }
    }

    /** Gets or sets the message being interacted with. */
    message!: StoredMessage;

    /** Gets or sets the agent value. */
    get agent(): StoredMessageAgentTypes {
        return this.message.type as StoredMessageAgentTypes ?? 'unknown';
    }

    set agent(value: StoredMessageAgentTypes) {
        if (value === 'none') {
            this.message.data.role = undefined;
            this.message.type = undefined as any;
        } else {
            this.message.data.role = value;
            this.message.type = value;
        }
    }

    /** Gets or sets the message content. */
    get content(): string {
        return this.message.data.content;
    }

    set content(value: string) {
        this.message.data.content = value;
    }

    /** Gets or sets the user's name that sent this message. */
    get name(): string | undefined {
        const speaker = getSpeakerFromStoredMessage(this.message);
        return this.message.data.name ?? speaker?.name ?? '';
    }
    set name(value: string | undefined) {

        if (!this.message.data.additional_kwargs) {
            this.message.data.additional_kwargs = {};
        }

        this.message.data.name = value;
        const speaker = getSpeakerFromStoredMessage(this.message);
        if (speaker) {
            speaker.name = value;
        }
    }

    get id() {
        const speaker = getSpeakerFromStoredMessage(this.message);
        return this.message.data.id || this.message.data.additional_kwargs?.['id'] || '';
    }

    get agentId() {
        const speaker = getSpeakerFromStoredMessage(this.message);
        return speaker?.speakerId;
    }
    set agentId(value: string | undefined) {
        if (!this.message.data.additional_kwargs) {
            this.message.data.additional_kwargs = {
                [MESSAGE_SPEAKER_KEY]: {}
            };
        }
        const speaker = getSpeakerFromStoredMessage(this.message);
        if (speaker) {
            speaker.speakerId = value;
        }
    }

    get taskId(): string | undefined {
        return getMessageTaskId(this.message);
    }
    set taskId(value: string | undefined) {
        setMessageTaskId(this.message, value);
    }

    /** Gets or sets a boolean value indicating whether or not this
     *   message is disabled, making omitting it from LLM calls.
     */
    get disabled(): boolean {
        const params = getDtalkParams(this.message);
        return !!params.disabled;
    }
    set disabled(value: boolean) {
        const params = getDtalkParams(this.message);
        params.disabled = value;
    }
}
