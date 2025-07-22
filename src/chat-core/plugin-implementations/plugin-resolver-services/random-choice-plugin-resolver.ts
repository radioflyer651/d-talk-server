import { IPluginTypeResolver } from "../../agent-plugin/i-plugin-type-resolver";
import { RandomChoicePlugin } from "../plugins/random-choice.plugin";
import { RANDOM_CHOICE_PLUGIN_TYPE_ID } from "../../../model/shared-models/chat-core/plugins/plugin-type-constants.data";
import { PluginInstanceReference } from "../../../model/shared-models/chat-core/plugin-instance-reference.model";
import { PluginSpecification } from "../../../model/shared-models/chat-core/plugin-specification.model";
import { PluginAttachmentTarget } from "../../agent-plugin/agent-plugin-base.service";

export class RandomChoicePluginResolver implements IPluginTypeResolver<RandomChoicePlugin> {
    canImplementType(typeName: string): boolean {
        return typeName === RANDOM_CHOICE_PLUGIN_TYPE_ID;
    }
    
    async createNewPlugin(specification: PluginSpecification, attachedTo: PluginAttachmentTarget): Promise<RandomChoicePlugin> {
        const result = new RandomChoicePlugin(specification);
        result.attachedTo = attachedTo;
        return result;
    }

    async hydratePlugin(pluginInstance: PluginInstanceReference, attachedTo: PluginAttachmentTarget): Promise<RandomChoicePlugin> {
        const result = new RandomChoicePlugin(pluginInstance);
        result.attachedTo = attachedTo;
        return result;
    }
}
