import { PluginInstanceReference } from "../../../model/shared-models/chat-core/plugin-instance-reference.model";
import { PluginSpecification } from "../../../model/shared-models/chat-core/plugin-specification.model";
import { HIDE_MESSAGES_FROM_OTHER_AGENTS_PLUGIN_TYPE_ID } from "../../../model/shared-models/chat-core/plugins/plugin-type-constants.data";
import { PluginAttachmentTarget } from "../../agent-plugin/agent-plugin-base.service";
import { IPluginTypeResolver } from "../../agent-plugin/i-plugin-type-resolver";
import { HideMessagesFromOtherAgentsPlugin } from "../plugins/hide-messages-from-other-agents.plugin";

/**
 * Resolver service for the Hide Messages From Other Agents plugin.
 * Handles the creation and hydration of plugin instances.
 */
export class HideMessagesFromOtherAgentsPluginResolver implements IPluginTypeResolver<HideMessagesFromOtherAgentsPlugin> {
    
    /**
     * Determines if this resolver can handle the specified plugin type.
     * @param typeName - The plugin type name to check
     * @returns True if this resolver can handle the type, false otherwise
     */
    canImplementType(typeName: string): boolean {
        return typeName === HIDE_MESSAGES_FROM_OTHER_AGENTS_PLUGIN_TYPE_ID;
    }

    /**
     * Creates a new instance of the Hide Messages From Other Agents plugin.
     * @param specification - The plugin specification containing configuration
     * @param attachedTo - The target (agent, chat room, or job) this plugin is attached to
     * @returns A new plugin instance
     */
    async createNewPlugin(specification: PluginSpecification<undefined>, attachedTo: PluginAttachmentTarget): Promise<HideMessagesFromOtherAgentsPlugin> {
        const result = new HideMessagesFromOtherAgentsPlugin(specification);
        result.attachedTo = attachedTo;
        return result;
    }

    /**
     * Hydrates an existing plugin instance from stored data.
     * @param pluginInstance - The stored plugin instance data
     * @param attachedTo - The target (agent, chat room, or job) this plugin is attached to
     * @returns A hydrated plugin instance
     */
    async hydratePlugin(pluginInstance: PluginInstanceReference<undefined>, attachedTo: PluginAttachmentTarget): Promise<HideMessagesFromOtherAgentsPlugin> {
        const result = new HideMessagesFromOtherAgentsPlugin(pluginInstance);
        result.attachedTo = attachedTo;
        return result;
    }
}