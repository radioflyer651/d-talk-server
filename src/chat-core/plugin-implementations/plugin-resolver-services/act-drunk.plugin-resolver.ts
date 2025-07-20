import { PluginInstanceReference } from "../../../model/shared-models/chat-core/plugin-instance-reference.model";
import { PluginSpecification } from "../../../model/shared-models/chat-core/plugin-specification.model";
import { ACT_DRUNK, ROOM_INFO_PLUGIN_TYPE_ID } from "../../../model/shared-models/chat-core/plugins/plugin-type-constants.data";
import { PluginAttachmentTarget } from "../../agent-plugin/agent-plugin-base.service";
import { IPluginTypeResolver } from "../../agent-plugin/i-plugin-type-resolver";
import { ActDrunkPlugin } from "../plugins/act-drunk.plugin";

export class ActDrunkPluginResolver implements IPluginTypeResolver<ActDrunkPlugin> {
    canImplementType(typeName: string): boolean {
        return typeName === ACT_DRUNK;
    }

    async createNewPlugin(specification: PluginSpecification, attachedTo: PluginAttachmentTarget): Promise<ActDrunkPlugin> {
        const result = new ActDrunkPlugin(specification);
        result.attachedTo = attachedTo;
        return result;
    }

    async hydratePlugin(pluginInstance: PluginInstanceReference, attachedTo: PluginAttachmentTarget): Promise<ActDrunkPlugin> {
        const result = new ActDrunkPlugin(pluginInstance);
        result.attachedTo = attachedTo;
        return result;
    }
}