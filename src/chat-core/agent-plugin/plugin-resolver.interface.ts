import { AgentPluginBase } from "./agent-plugin-base.service";
import { PluginSpecification } from "../../model/shared-models/chat-core/plugin-specification.model";
import { PluginInstanceReference } from "../../model/shared-models/chat-core/plugin-instance-reference.model";


export interface IPluginResolver {
    /** Given a specified plugin type and ID, returns a plugin if it is found.  Otherwise undefined. */
    getPluginInstance(pluginInstance: PluginInstanceReference): Promise<AgentPluginBase | undefined>;

    /** Given a set of PluginInstanceReference objects, returns all plugins for those objects. */
    getPluginInstances(pluginReferences: PluginInstanceReference[]): Promise<AgentPluginBase[]>;

    /**
     * Creates a new plugin instance of the specified type, with optional initialization data.
     * Returns the created plugin instance. */
    createPluginInstance(pluginReference: PluginSpecification): Promise<AgentPluginBase>;
}