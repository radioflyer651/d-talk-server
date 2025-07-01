import { ObjectId } from "mongodb";
import { ChatAgentIdentityConfiguration } from "./agent-configuration.model";
import { PluginInstanceReference } from "../../../chat-core/agent-plugin/plugin-instance-reference.model";


/** Represents a specific instance of a chat agent, from a specific identity. */
export interface AgentInstanceConfiguration {
    _id: ObjectId;
    
    /** The ID of the project this agent belongs to. */
    projectId: ObjectId;

    /** An optional name to give to this instance of an agent. */
    name?: string;

    /** The core configuration for this agent.  This is the permanent identity of the agent. */
    identity: ChatAgentIdentityConfiguration;

    /** The instance IDs of the plugins that the agent has available to them. 
     *   These plugins are made available through the agent identity only.    */
    permanentPlugins: PluginInstanceReference[];

    /** A dictionary of string (object IDs) referring to the identity.plugins IDs,
     *   and values of the configurations of the plugin. */
    instancePlugins: PluginInstanceReference[];
}
