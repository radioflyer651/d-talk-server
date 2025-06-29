import { ObjectId } from "mongodb";
import { ChatAgentIdentityConfiguration } from "./agent-configuration.model";
import { PluginInstanceReference } from "../../agent-plugin/plugin-context.model";


/** Represents a specific instance of a chat agent, from a specific identity. */
export interface AgentInstanceConfiguration {
    _id: ObjectId;

    /** The core configuration for this agent.  This is the permanent identity of the agent. */
    identity: ChatAgentIdentityConfiguration;

    /** The instance IDs of the plugins that the agent has available to them. 
     *   These plugins are made available through the agent identity only.    */
    permanentPlugins: PluginInstanceReference[];

    /** A dictionary of string (object IDs) referring to the identity.plugins IDs,
     *   and values of the configurations of the plugin. */
    instancePlugins: PluginInstanceReference[];
}
