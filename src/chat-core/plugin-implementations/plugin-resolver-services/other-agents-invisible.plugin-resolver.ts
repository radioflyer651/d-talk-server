import { PluginInstanceReference } from "../../../model/shared-models/chat-core/plugin-instance-reference.model";
import { PluginSpecification } from "../../../model/shared-models/chat-core/plugin-specification.model";
import { OTHER_AGENTS_INVISIBLE_PLUGIN, ROOM_INFO_PLUGIN_TYPE_ID } from "../../../model/shared-models/chat-core/plugins/plugin-type-constants.data";
import { PluginAttachmentTargetTypes } from "../../agent-plugin/agent-plugin-base.service";
import { IPluginTypeResolver } from "../../agent-plugin/i-plugin-type-resolver";
import { OtherAgentsInvisiblePlugin } from "../plugins/other-agents-invisible.plugin";

export class OtherAgentsInvisiblePluginResolver implements IPluginTypeResolver<OtherAgentsInvisiblePlugin> {
    canImplementType(typeName: string): boolean {
        return typeName === OTHER_AGENTS_INVISIBLE_PLUGIN;
    }

    async createNewPlugin(specification: PluginSpecification, attachedTo: PluginAttachmentTargetTypes): Promise<OtherAgentsInvisiblePlugin> {
        const result = new OtherAgentsInvisiblePlugin(specification);
        result.attachedTo = attachedTo;
        return result;
    }

    hydratePlugin(pluginInstance: PluginInstanceReference, attachedTo: PluginAttachmentTargetTypes): OtherAgentsInvisiblePlugin {
        const result = new OtherAgentsInvisiblePlugin(pluginInstance);
        result.attachedTo = attachedTo;
        return result;
    }
}