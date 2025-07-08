import { PluginInstanceReference } from "../../../model/shared-models/chat-core/plugin-instance-reference.model";
import { PluginSpecification } from "../../../model/shared-models/chat-core/plugin-specification.model";
import { DEBUG_PLUGIN, OTHER_AGENTS_INVISIBLE_PLUGIN, ROOM_INFO_PLUGIN_TYPE_ID } from "../../../model/shared-models/chat-core/plugins/plugin-type-constants.data";
import { PluginAttachmentTargetTypes } from "../../agent-plugin/agent-plugin-base.service";
import { IPluginTypeResolver } from "../../agent-plugin/i-plugin-type-resolver";
import { DebugPlugin } from "../plugins/debug.plugin";
import { OtherAgentsInvisiblePlugin } from "../plugins/other-agents-invisible.plugin";

export class DebugPluginResolver implements IPluginTypeResolver<DebugPlugin> {
    canImplementType(typeName: string): boolean {
        return typeName === DEBUG_PLUGIN;
    }

    async createNewPlugin(specification: PluginSpecification, attachedTo: PluginAttachmentTargetTypes): Promise<DebugPlugin> {
        const result = new DebugPlugin(specification);
        result.attachedTo = attachedTo;
        return result;
    }

    hydratePlugin(pluginInstance: PluginInstanceReference, attachedTo: PluginAttachmentTargetTypes): DebugPlugin {
        const result = new DebugPlugin(pluginInstance);
        result.attachedTo = attachedTo;
        return result;
    }
}