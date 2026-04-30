import { IPluginTypeResolver } from '../../agent-plugin/i-plugin-type-resolver';
import { PluginAttachmentTarget } from '../../agent-plugin/agent-plugin-base.service';
import { PluginInstanceReference } from '../../../model/shared-models/chat-core/plugin-instance-reference.model';
import { PluginSpecification } from '../../../model/shared-models/chat-core/plugin-specification.model';
import { SubAgentPlugin } from '../plugins/sub-agent.plugin';
import { SUB_AGENT_PLUGIN_TYPE_ID } from '../../../model/shared-models/chat-core/plugins/plugin-type-constants.data';
import { ChattingService } from '../../chatting/chatting.service';
import { ChatRoomDbService } from '../../../database/chat-core/chat-room-db.service';
import { AgentDbService } from '../../../database/chat-core/agent-db.service';
import { AgentInstanceDbService } from '../../../database/chat-core/agent-instance-db.service';
import { ChatCoreService } from '../../../services/chat-core.service';
import { AuthDbService } from '../../../database/auth-db.service';

export class SubAgentPluginResolver implements IPluginTypeResolver<SubAgentPlugin> {
    constructor(
        private readonly chattingServiceProvider: () => ChattingService,
        private readonly chatRoomDbService: ChatRoomDbService,
        private readonly agentDbService: AgentDbService,
        private readonly agentInstanceDbService: AgentInstanceDbService,
        private readonly chatCoreService: ChatCoreService,
        private readonly authDbService: AuthDbService,
    ) {}

    canImplementType(typeName: string): boolean {
        return typeName === SUB_AGENT_PLUGIN_TYPE_ID;
    }

    async createNewPlugin(specification: PluginSpecification, attachedTo: PluginAttachmentTarget): Promise<SubAgentPlugin> {
        const result = new SubAgentPlugin(
            specification,
            this.chattingServiceProvider,
            this.chatRoomDbService,
            this.agentDbService,
            this.agentInstanceDbService,
            this.chatCoreService,
            this.authDbService,
        );
        result.attachedTo = attachedTo;
        return result;
    }

    async hydratePlugin(pluginInstance: PluginInstanceReference, attachedTo: PluginAttachmentTarget): Promise<SubAgentPlugin> {
        const result = new SubAgentPlugin(
            pluginInstance,
            this.chattingServiceProvider,
            this.chatRoomDbService,
            this.agentDbService,
            this.agentInstanceDbService,
            this.chatCoreService,
            this.authDbService,
        );
        result.attachedTo = attachedTo;
        return result;
    }
}
