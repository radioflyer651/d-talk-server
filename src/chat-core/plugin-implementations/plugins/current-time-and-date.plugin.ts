import { AgentPluginBase } from '../../agent-plugin/agent-plugin-base.service';
import { ChatCallInfo, IChatLifetimeContributor } from '../../chat-lifetime-contributor.interface';
import { CURRENT_TIME_AND_DATE_PLUGIN_TYPE_ID } from '../../../model/shared-models/chat-core/plugins/plugin-type-constants.data';
import { BaseMessage, SystemMessage } from '@langchain/core/messages';
import { MessagePositionTypes, PositionableMessage } from '../../../model/shared-models/chat-core/positionable-message.model';
import { PluginInstanceReference } from '../../../model/shared-models/chat-core/plugin-instance-reference.model';
import { PluginSpecification } from '../../../model/shared-models/chat-core/plugin-specification.model';
import { getMessageDateTime } from '../../../model/shared-models/chat-core/utils/messages.utils';

export class CurrentTimeAndDatePlugin extends AgentPluginBase implements IChatLifetimeContributor {
    agentUserManual?: string | undefined;
    readonly type = CURRENT_TIME_AND_DATE_PLUGIN_TYPE_ID;

    constructor(params: PluginInstanceReference | PluginSpecification) {
        super(params);
    }


    async addPreChatMessages(info: ChatCallInfo): Promise<PositionableMessage<BaseMessage>[]> {
        const now = new Date();
        const currentDay = now.toLocaleDateString(undefined, { weekday: 'long' });
        const currentDate = now.toLocaleDateString();

        return [
            {
                location: MessagePositionTypes.OffsetFromEnd,
                offset: 1,
                message: new SystemMessage(
                    `Current Time: ${now.toLocaleTimeString()}, Current Date: ${currentDate}, Current Day: ${currentDay}`
                )
            }
        ];
    }

    async modifyCallMessages(messageHistory: BaseMessage[]): Promise<BaseMessage[]> {
        const result: BaseMessage[] = [];

        messageHistory.forEach(m => {
            // Get the date/time of the message, if there is one.
            const dateTime = getMessageDateTime(m);

            // Add a date/time message for this if there was one.
            if (dateTime) {
                const messageDay = dateTime.toLocaleDateString(undefined, { weekday: 'long' });
                const messageDate = dateTime.toLocaleDateString();
                result.push(new SystemMessage(`Following message Date/Time: ${messageDate}, ${dateTime.toLocaleTimeString()}, Message Day: ${messageDay}`));
            }

            // Add the message itself.
            result.push(m);
        });

        // Return the result.
        return result;
    }
}
