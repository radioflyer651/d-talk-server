import { IPluginTypeResolver } from "../../agent-plugin/i-plugin-type-resolver";
import { IgnoreSpecificAgentPlugin } from "../plugins/ignore-specific-agent.plugin";
import { IGNORE_SPECIFIC_AGENT_PLUGIN_TYPE_ID } from "../../../model/shared-models/chat-core/plugins/plugin-type-constants.data";
import { PluginSpecification } from "../../../model/shared-models/chat-core/plugin-specification.model";
import { PluginAttachmentTargetTypes } from "../../agent-plugin/agent-plugin-base.service";
import { PluginInstanceReference } from "../../../model/shared-models/chat-core/plugin-instance-reference.model";

export class IgnoreSpecificAgentPluginResolver implements IPluginTypeResolver<IgnoreSpecificAgentPlugin> {
    canImplementType(typeName: string): boolean {
        return typeName === IGNORE_SPECIFIC_AGENT_PLUGIN_TYPE_ID;
    }

    async createNewPlugin(specification: PluginSpecification, attachedTo: PluginAttachmentTargetTypes): Promise<IgnoreSpecificAgentPlugin> {
        const result = new IgnoreSpecificAgentPlugin(specification);
        result.attachedTo = attachedTo;
        return result;
    }

    async hydratePlugin(pluginInstance: PluginInstanceReference, attachedTo: PluginAttachmentTargetTypes): Promise<IgnoreSpecificAgentPlugin> {
        const result = new IgnoreSpecificAgentPlugin(pluginInstance);
        result.attachedTo = attachedTo;
        return result;
    }
}
