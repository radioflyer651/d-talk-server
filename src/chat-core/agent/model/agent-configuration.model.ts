import { PluginSpecification } from "../../agent-plugin/plugin-specification.model";
import { ModelServiceParams } from "./model-service-params.model";

/** The configurable items that make up a chat agent. */
export interface ChatAgentIdentityConfiguration {

    /** The information needed to specify and crate a chat model to support his agent. */
    modelInfo: ModelServiceParams;

    /** A name to identify this configuration. */
    name: string;

    /** A name to show in chat for this agent. */
    chatName: string;

    /** This is provided as a system message to the agent.  This should inform the agent of its identity
     *   in a way of "You are XX and you are an expert with YY."  It should not include instructions, but
     *   things about the agent that informs its personality. */
    identityStatements: string[];

    /** The base instructions that make up this agent.  These instructions are things that the agent
     *   should do, or remember.  It should not overlap with the identityStatements though. */
    baseInstructions: string[];

    /** A list of plugin types for the plugins that the agent should have available. */
    plugins: PluginSpecification[];
}