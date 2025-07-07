import { BaseMessage, SystemMessage } from "@langchain/core/messages";
import { AgentPluginBase } from "../../agent-plugin/agent-plugin-base.service";
import { ChatCallInfo } from "../../chat-lifetime-contributor.interface";
import { MessagePositionTypes, PositionableMessage } from "../../../model/shared-models/chat-core/positionable-message.model";
import { ROOM_INFO_PLUGIN_TYPE_ID } from "../../../model/shared-models/chat-core/plugins/plugin-type-constants.data";
import { PluginInstanceReference } from "../../../model/shared-models/chat-core/plugin-instance-reference.model";
import { PluginSpecification } from "../../../model/shared-models/chat-core/plugin-specification.model";


export class RoomInfoPlugin extends AgentPluginBase {
    readonly type: string = ROOM_INFO_PLUGIN_TYPE_ID;
    agentUserManual?: string | undefined;

    constructor(params: PluginInstanceReference | PluginSpecification) {
        super(params);
    }

    async addPreChatMessages(info: ChatCallInfo): Promise<PositionableMessage<BaseMessage>[]> {
        // Get the OTHER agents in the room.  Only those attached to a job though, because those are the only ones able to respond.
        const jobAgents = this.chatRoom.agents.filter(a => this.chatRoom.chatJobs.some(j => j.agentId?.equals(a.data._id) && !a.data._id.equals(this.agent?.data._id)));
        if (jobAgents.length < 1) {
            return [];
        }

        const agentsMessage = `The agents in this chat room are: ${jobAgents.map(a => `(ID: ${a.data._id}) ${a.data.name ?? a.identity.chatName}`)}`;
        return [
            { location: MessagePositionTypes.AfterAgentIdentity, message: new SystemMessage(agentsMessage) }
        ];
    }
}