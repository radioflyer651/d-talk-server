import { IPluginTypeResolver } from '../../agent-plugin/i-plugin-type-resolver';
import { CurrentTimeAndDatePlugin } from '../plugins/current-time-and-date.plugin';
import { CURRENT_TIME_AND_DATE_PLUGIN_TYPE_ID } from '../../../model/shared-models/chat-core/plugins/plugin-type-constants.data';
import { PluginInstanceReference } from '../../../model/shared-models/chat-core/plugin-instance-reference.model';
import { PluginSpecification } from '../../../model/shared-models/chat-core/plugin-specification.model';
import { PluginAttachmentTarget } from '../../agent-plugin/agent-plugin-base.service';

export class CurrentTimeAndDatePluginResolver implements IPluginTypeResolver<CurrentTimeAndDatePlugin> {
    canImplementType(typeName: string): boolean {
        return typeName === CURRENT_TIME_AND_DATE_PLUGIN_TYPE_ID;
    }
    async createNewPlugin(specification: PluginSpecification, attachedTo: PluginAttachmentTarget): Promise<CurrentTimeAndDatePlugin> {
        const result = new CurrentTimeAndDatePlugin(specification);
        result.attachedTo = attachedTo;
        return result;
    }

    async hydratePlugin(pluginInstance: PluginInstanceReference, attachedTo: PluginAttachmentTarget): Promise<CurrentTimeAndDatePlugin> {
        const result = new CurrentTimeAndDatePlugin(pluginInstance);
        result.attachedTo = attachedTo;
        return result;
    }
}
