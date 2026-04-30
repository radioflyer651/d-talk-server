import { IPluginTypeResolver } from '../../agent-plugin/i-plugin-type-resolver';
import { PluginAttachmentTarget } from '../../agent-plugin/agent-plugin-base.service';
import { PluginInstanceReference } from '../../../model/shared-models/chat-core/plugin-instance-reference.model';
import { PluginSpecification } from '../../../model/shared-models/chat-core/plugin-specification.model';
import { PromptToolCallingPlugin } from '../plugins/prompt-tool-calling.plugin';
import { PROMPT_TOOL_CALLING_PLUGIN_TYPE_ID } from '../../../model/shared-models/chat-core/plugins/plugin-type-constants.data';

export class PromptToolCallingPluginResolver implements IPluginTypeResolver<PromptToolCallingPlugin> {
    canImplementType(typeName: string): boolean {
        return typeName === PROMPT_TOOL_CALLING_PLUGIN_TYPE_ID;
    }

    async createNewPlugin(specification: PluginSpecification, attachedTo: PluginAttachmentTarget): Promise<PromptToolCallingPlugin> {
        const result = new PromptToolCallingPlugin(specification);
        result.attachedTo = attachedTo;
        return result;
    }

    async hydratePlugin(pluginInstance: PluginInstanceReference, attachedTo: PluginAttachmentTarget): Promise<PromptToolCallingPlugin> {
        const result = new PromptToolCallingPlugin(pluginInstance);
        result.attachedTo = attachedTo;
        return result;
    }
}
