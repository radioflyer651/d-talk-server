
import { IPluginTypeResolver } from '../../agent-plugin/i-plugin-type-resolver';
import { PluginAttachmentTarget } from '../../agent-plugin/agent-plugin-base.service';
import { PluginInstanceReference } from '../../../model/shared-models/chat-core/plugin-instance-reference.model';
import { PluginSpecification } from '../../../model/shared-models/chat-core/plugin-specification.model';
import { ArithmeticPlugin } from '../plugins/arithmetic.plugin';
import { ARITHMETIC_PLUGIN_TYPE_ID } from '../../../model/shared-models/chat-core/plugins/plugin-type-constants.data';

export class ArithmeticPluginResolver implements IPluginTypeResolver<ArithmeticPlugin> {
    canImplementType(typeName: string): boolean {
        return typeName === ARITHMETIC_PLUGIN_TYPE_ID;
    }

    async createNewPlugin(specification: PluginSpecification, attachedTo: PluginAttachmentTarget): Promise<ArithmeticPlugin> {
        const result = new ArithmeticPlugin(specification);
        result.attachedTo = attachedTo;
        return result;
    }

    async hydratePlugin(pluginInstance: PluginInstanceReference, attachedTo: PluginAttachmentTarget): Promise<ArithmeticPlugin> {
        const result = new ArithmeticPlugin(pluginInstance);
        result.attachedTo = attachedTo;
        return result;
    }
}
