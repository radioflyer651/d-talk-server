import { PluginInstanceReference } from "../../model/shared-models/chat-core/plugin-instance-reference.model";
import { PluginSpecification } from "../../model/shared-models/chat-core/plugin-specification.model";
import { AgentPluginBase, PluginAttachmentTargetTypes } from "./agent-plugin-base.service";


export interface IPluginTypeResolver<T_PLUGIN extends AgentPluginBase> {

    /** Returns a boolean value indicating whether or not this plugin type resolver can create/hydrate a specified plugin type. */
    canImplementType(typeName: string): boolean;

    /** Creates a new instance of the specified plugin type. */
    createNewPlugin(specification: PluginSpecification, attachedTo: PluginAttachmentTargetTypes): Promise<T_PLUGIN>;

    /** Given a specified plugin instance reference, returns an instance of the plugin with the provided state. */
    hydratePlugin(pluginInstance: PluginInstanceReference, attachedTo: PluginAttachmentTargetTypes): Promise<T_PLUGIN>;
}