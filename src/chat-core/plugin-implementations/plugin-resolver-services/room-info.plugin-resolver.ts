import { PluginInstanceReference } from "../../../model/shared-models/chat-core/plugin-instance-reference.model";
import { PluginSpecification } from "../../../model/shared-models/chat-core/plugin-specification.model";
import { ROOM_INFO_PLUGIN_TYPE_ID } from "../../../model/shared-models/chat-core/plugins/plugin-type-constants.data";
import { PluginAttachmentTargetTypes } from "../../agent-plugin/agent-plugin-base.service";
import { IPluginTypeResolver } from "../../agent-plugin/i-plugin-type-resolver";
import { RoomInfoPlugin } from "../plugins/room-info.plugin";

export class RoomInfoPluginResolver implements IPluginTypeResolver<RoomInfoPlugin> {
    canImplementType(typeName: string): boolean {
        return typeName === ROOM_INFO_PLUGIN_TYPE_ID;
    }

    async createNewPlugin(specification: PluginSpecification, attachedTo: PluginAttachmentTargetTypes): Promise<RoomInfoPlugin> {
        const result = new RoomInfoPlugin(specification);
        result.attachedTo = attachedTo;
        return result;
    }

    async hydratePlugin(pluginInstance: PluginInstanceReference, attachedTo: PluginAttachmentTargetTypes): Promise<RoomInfoPlugin> {
        const result = new RoomInfoPlugin(pluginInstance);
        result.attachedTo = attachedTo;
        return result;
    }
}