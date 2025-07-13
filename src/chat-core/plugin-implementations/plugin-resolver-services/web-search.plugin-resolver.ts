import { IPluginTypeResolver } from "../../agent-plugin/i-plugin-type-resolver";
import { WebSearchPlugin } from "../plugins/web-search.plugin";
import { WEB_SEARCH_PLUGIN_TYPE_ID } from "../../../model/shared-models/chat-core/plugins/plugin-type-constants.data";
import { PluginInstanceReference } from "../../../model/shared-models/chat-core/plugin-instance-reference.model";
import { PluginSpecification } from "../../../model/shared-models/chat-core/plugin-specification.model";
import { PluginAttachmentTargetTypes } from "../../agent-plugin/agent-plugin-base.service";

export class WebSearchPluginResolver implements IPluginTypeResolver<WebSearchPlugin> {
    constructor(private tavilyApiKey: string) {

    }

    canImplementType(typeName: string): boolean {
        return typeName === WEB_SEARCH_PLUGIN_TYPE_ID;
    }
    
    async createNewPlugin(specification: PluginSpecification, attachedTo: PluginAttachmentTargetTypes) {
        const result = new WebSearchPlugin(specification, this.tavilyApiKey);
        result.attachedTo = attachedTo;
        return result;
    }
    
    async hydratePlugin(pluginInstance: PluginInstanceReference, attachedTo: PluginAttachmentTargetTypes) {
        const result = new WebSearchPlugin(pluginInstance, this.tavilyApiKey);
        result.attachedTo = attachedTo;
        return result;
    }
}
