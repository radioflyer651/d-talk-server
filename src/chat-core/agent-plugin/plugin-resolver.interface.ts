import { AgentPluginBase, PluginAttachmentTargetTypes } from "./agent-plugin-base.service";
import { PluginSpecification } from "../../model/shared-models/chat-core/plugin-specification.model";
import { PluginInstanceReference } from "../../model/shared-models/chat-core/plugin-instance-reference.model";


export interface IPluginResolver {
    /** Given a specified plugin type and ID, returns a plugin if it is found.  Otherwise undefined. */
    getPluginInstance(pluginInstance: PluginInstanceReference, attachmentTarget: PluginAttachmentTargetTypes, attachToAttachmentTarget: boolean): Promise<AgentPluginBase | undefined>;

    /** Given a set of PluginInstanceReference objects, returns all plugins for those objects. */
    getPluginInstances(pluginReferences: PluginInstanceReference[], attachmentTarget: PluginAttachmentTargetTypes, attachToAttachmentTarget: boolean): Promise<AgentPluginBase[]>;

    /**
     * Creates a new plugin instance of the specified type, with optional initialization data.
     * Returns the created plugin instance. */
    createPluginInstance(pluginReference: PluginSpecification, attachmentTarget: PluginAttachmentTargetTypes, attachToAttachmentTarget: boolean): Promise<AgentPluginBase>;

    /** Hydrates all plugins in a specified set of plugin specifications and instances.  If a plugin is not initialized yet, it will be, and will be added to the pluginInstances parameter.
     *   If indicated, the plugins will be added to the attachmentTarget's plugin list. 
     *   The return value is a set of "new" plugins (that weren't instantiated before), and existing plugins (those that were).*/
    hydrateAllPlugins(pluginReferences: PluginSpecification[], pluginInstances: PluginInstanceReference[], attachmentTarget: PluginAttachmentTargetTypes, attachToAttachmentTarget: boolean): Promise<{ newPlugins: AgentPluginBase[], existingPlugins: AgentPluginBase[]; }>;
}