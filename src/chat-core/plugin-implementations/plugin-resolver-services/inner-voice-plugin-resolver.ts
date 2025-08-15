import { InnerVoicePlugin } from "../plugins/inner-voice.plugin";
import { IPluginTypeResolver } from "../../agent-plugin/i-plugin-type-resolver";
import { PluginInstanceReference } from "../../../model/shared-models/chat-core/plugin-instance-reference.model";
import { INNER_VOICE_PLUGIN_TYPE_ID } from "../../../model/shared-models/chat-core/plugins/plugin-type-constants.data";
import { InnerVoicePluginParams } from "../../../model/shared-models/chat-core/plugins/inner-voice-plugin.params";
import { PluginSpecification } from "../../../model/shared-models/chat-core/plugin-specification.model";
import { PluginAttachmentTarget } from "../../agent-plugin/agent-plugin-base.service";

export class InnerVoicePluginResolver implements IPluginTypeResolver<InnerVoicePlugin> {
    canImplementType(typeName: string): boolean {
        return typeName === INNER_VOICE_PLUGIN_TYPE_ID;
    }

    async createNewPlugin(spec: PluginSpecification<InnerVoicePluginParams>, attachedTo: PluginAttachmentTarget): Promise<InnerVoicePlugin> {
        const plugin = new InnerVoicePlugin(spec);
        plugin.attachedTo = attachedTo;
        return plugin;
    }

    async hydratePlugin(instance: PluginInstanceReference<InnerVoicePluginParams>, attachedTo: PluginAttachmentTarget): Promise<InnerVoicePlugin> {
        const plugin = new InnerVoicePlugin(instance);
        plugin.attachedTo = attachedTo;
        return plugin;
    }
}
