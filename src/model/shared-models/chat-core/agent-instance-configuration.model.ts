import { ObjectId } from "mongodb";
import { PluginInstanceReference } from "./plugin-instance-reference.model";
import { ChatDocumentLinker } from "./documents/chat-document-reference.model";
import { IVoiceParameters } from "./voice/voice-parameters-base.model";


/** Represents a specific instance of a chat agent, from a specific identity. */
export interface AgentInstanceConfiguration extends ChatDocumentLinker {
    _id: ObjectId;

    /** The ID of the project this agent belongs to. */
    projectId: ObjectId;

    /** The core configuration for this agent.  This is the permanent identity of the agent. */
    identity: ObjectId;

    /** An optional name to give to this instance of an agent. */
    name?: string;

    /** A list of plugin instances created for this agent. */
    plugins: PluginInstanceReference[];
}
