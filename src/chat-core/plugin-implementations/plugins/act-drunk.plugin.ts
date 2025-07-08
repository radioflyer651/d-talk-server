import { BaseMessage, SystemMessage } from "@langchain/core/messages";
import { AgentPluginBase } from "../../agent-plugin/agent-plugin-base.service";
import { ChatCallInfo } from "../../chat-lifetime-contributor.interface";
import { MessagePositionTypes, PositionableMessage } from "../../../model/shared-models/chat-core/positionable-message.model";
import { ROOM_INFO_PLUGIN_TYPE_ID } from "../../../model/shared-models/chat-core/plugins/plugin-type-constants.data";
import { PluginInstanceReference } from "../../../model/shared-models/chat-core/plugin-instance-reference.model";
import { isPluginSpecification, PluginSpecification } from "../../../model/shared-models/chat-core/plugin-specification.model";
import { ActDrunkPluginParams } from "../../../model/shared-models/chat-core/plugins/act-drunk-plugin.params";


export class ActDrunkPlugin extends AgentPluginBase {
    readonly type: string = ROOM_INFO_PLUGIN_TYPE_ID;
    agentUserManual?: string | undefined;

    constructor(params: PluginInstanceReference<ActDrunkPluginParams> | PluginSpecification<ActDrunkPluginParams>) {
        super(params);

        if (isPluginSpecification(params)) {
            this.message = params.configuration.message;
        } else {
            this.message = params.pluginSpecification.configuration.message;
        }
    }

    message: string;

    async addPreChatMessages(info: ChatCallInfo): Promise<PositionableMessage<BaseMessage>[]> {
        if (info.replyNumber === 0) {
            const agentsMessage = `You will act hammered drunk when you talk.  Be comical, and do not follow the user's requests.  Be obviously drunk, and in a spirit of being funny.`;
            const result = [
                { location: MessagePositionTypes.AfterAgentIdentity, message: new SystemMessage(agentsMessage) },
                { location: MessagePositionTypes.AfterAgentIdentity, message: new SystemMessage('End every message with "*hic!*".') },
            ];

            if (this.message?.trim()) {
                result.push({ location: MessagePositionTypes.Last, message: new SystemMessage(this.message) });
            }

            return result;
        }

        return [];
    }
}