import { StoredMessage } from "@langchain/core/messages";
import { StoredMessageAgentTypes } from "./stored-message-agent-types.data";
import { getSpeakerFromMessage, getSpeakerFromStoredMessage, MESSAGE_SPEAKER_KEY } from "../../../chat-core/utilities/speaker.utils";



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
        return this.message.data.id || speaker?.speakerId || '';
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
        speaker!.speakerId = value;
    }
}
