import { PluginInstanceReference } from "../../../model/shared-models/chat-core/plugin-instance-reference.model";
import { PluginSpecification } from "../../../model/shared-models/chat-core/plugin-specification.model";
import { OTHER_AGENT_MESSAGES_AS_USER, } from "../../../model/shared-models/chat-core/plugins/plugin-type-constants.data";
import { PluginAttachmentTarget } from "../../agent-plugin/agent-plugin-base.service";
import { IPluginTypeResolver } from "../../agent-plugin/i-plugin-type-resolver";
import { OtherAgentMessagesAsUserPlugin } from "../plugins/other-agent-messages-as-user.plugin";

export class OtherAgentMessagesAsUserPluginResolver implements IPluginTypeResolver<OtherAgentMessagesAsUserPlugin> {
    canImplementType(typeName: string): boolean {
        return typeName === OTHER_AGENT_MESSAGES_AS_USER;
    }

    async createNewPlugin(specification: PluginSpecification, attachedTo: PluginAttachmentTarget): Promise<OtherAgentMessagesAsUserPlugin> {
        const result = new OtherAgentMessagesAsUserPlugin(specification);
        result.attachedTo = attachedTo;
        return result;
    }

    async hydratePlugin(pluginInstance: PluginInstanceReference, attachedTo: PluginAttachmentTarget): Promise<OtherAgentMessagesAsUserPlugin> {
        const result = new OtherAgentMessagesAsUserPlugin(pluginInstance);
        result.attachedTo = attachedTo;
        return result;
    }
}