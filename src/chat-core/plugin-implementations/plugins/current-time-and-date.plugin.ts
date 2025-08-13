import { AgentPluginBase } from '../../agent-plugin/agent-plugin-base.service';
import { ChatCallInfo, IChatLifetimeContributor } from '../../chat-lifetime-contributor.interface';
import { CURRENT_TIME_AND_DATE_PLUGIN_TYPE_ID } from '../../../model/shared-models/chat-core/plugins/plugin-type-constants.data';
import { BaseMessage, SystemMessage } from '@langchain/core/messages';
import { MessagePositionTypes, PositionableMessage } from '../../../model/shared-models/chat-core/positionable-message.model';
import { PluginInstanceReference } from '../../../model/shared-models/chat-core/plugin-instance-reference.model';
import { PluginSpecification } from '../../../model/shared-models/chat-core/plugin-specification.model';
import { getKwargs, getMessageDateTime } from '../../../model/shared-models/chat-core/utils/messages.utils';

const MESSAGE_CREATION_MARKER = 'createdByCurrentTimeDatePlugin';

export class CurrentTimeAndDatePlugin extends AgentPluginBase implements IChatLifetimeContributor {
    agentUserManual?: string | undefined;
    readonly type = CURRENT_TIME_AND_DATE_PLUGIN_TYPE_ID;

    constructor(params: PluginInstanceReference | PluginSpecification) {
        super(params);
    }


    async addPreChatMessages(info: ChatCallInfo): Promise<PositionableMessage<BaseMessage>[]> {
        // Exit if this plugin has been called on this history stack already.
        if (info.data[CURRENT_TIME_AND_DATE_PLUGIN_TYPE_ID] === true) {
            return [];
        }

        info.data[CURRENT_TIME_AND_DATE_PLUGIN_TYPE_ID] = true;

        const now = new Date();
        const currentDay = now.toLocaleDateString(undefined, { weekday: 'long' });
        const currentDate = now.toLocaleDateString();

        // Create the new message for the stack.
        const message = new SystemMessage(
            `Current Time: ${now.toLocaleTimeString()}, Current Date: ${currentDate}, Current Day: ${currentDay}`);

        // Mark it, indicating this plugin type created it.
        this.addMarkerToMessage(message);

        return [
            {
                location: MessagePositionTypes.OffsetFromEnd,
                offset: 1,
                message: message
            }
        ];
    }

    /** Given a specified message history, returns a boolean value indicating whether or not this plugin type has already been run on the chat history. */
    private isMessagesAnnotated(messageHistory: BaseMessage[]): boolean {
        return messageHistory.some(m => this.messageHasMarker(m));
    }

    /** Returns a boolean value indicating whether or not a specified message was created by this plugin type. */
    private messageHasMarker(message: BaseMessage): boolean {
        // Get the kwargs.
        const args = getKwargs(message);
        return args[MESSAGE_CREATION_MARKER] === true;
    }

    /** Adds a marker to a specified message indicating it was created by this plugin. */
    private addMarkerToMessage(message: BaseMessage): void {
        // Get the kwargs.
        const args = getKwargs(message);

        // Set the value.
        args[MESSAGE_CREATION_MARKER] = true;
    }

    async modifyCallMessages(messageHistory: BaseMessage[]): Promise<BaseMessage[]> {
        // Exit if this plugin has been called on this history stack already.
        if (this.isMessagesAnnotated(messageHistory)) {
            return messageHistory;
        }

        const result: BaseMessage[] = [];

        messageHistory.forEach(m => {
            // Get the date/time of the message, if there is one.
            const dateTime = getMessageDateTime(m);

            // Add a date/time message for this if there was one.
            if (dateTime) {
                // Create the new message for the message stack.
                const messageDay = dateTime.toLocaleDateString(undefined, { weekday: 'long' });
                const messageDate = dateTime.toLocaleDateString();
                const newMessage = new SystemMessage(`Following message Date/Time: ${messageDate}, ${dateTime.toLocaleTimeString()}, Message Day: ${messageDay}`);
                // Mark the message as having been created by this plugin.
                this.addMarkerToMessage(newMessage);
                result.push(newMessage);
            }

            // Add the message itself.
            result.push(m);
        });

        // Return the result.
        return result;
    }
}
