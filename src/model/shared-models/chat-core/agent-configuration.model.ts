import { ObjectId } from "mongodb";
import { PluginSpecification } from "./plugin-specification.model";
import { ModelServiceParams } from "./model-service-params.model";
import { PositionableMessage } from "./positionable-message.model";
import { StoredMessage } from "@langchain/core/messages";
import { IPluginConfigurationAttachmentType } from "./plugin-configuration-attachement-types.model";
import { ChatDocumentLinker } from "./documents/chat-document-reference.model";
import { IVoiceParameters } from "./voice/voice-parameters-base.model";

/** The configurable items that make up a chat agent. */
export interface ChatAgentIdentityConfiguration extends IPluginConfigurationAttachmentType, ChatDocumentLinker {
    _id: ObjectId;

    /** The information needed to specify and crate a chat model to support his agent. */
    modelInfo: ModelServiceParams;

    /** The ID of the project this agent configuration belongs to. */
    projectId: ObjectId;

    /** A name to identify this configuration. */
    name: string;

    /** Gets or sets a grouping name to help organize chat agents.  This is only for the UI
     *   and has no functional utility. */
    group?: string;

    /** A name to show in chat for this agent. */
    chatName: string;

    /** Gets or sets a description for this agent. */
    description: string;
    
    /** Boolean value indicating whether or not chat messages produced by this agent should be hidden in the UI. */
    hideMessages?: boolean;

    /** Contains the parameters needed to generate voice messages from text. */
    voiceMessageParams?: IVoiceParameters;

    /** This is provided as a system message to the agent.  This should inform the agent of its identity
     *   in a way of "You are XX and you are an expert with YY."  It should not include instructions, but
     *   things about the agent that informs its personality. */
    identityStatements: PositionableMessage<StoredMessage>[];

    /** The base instructions that make up this agent.  These instructions are things that the agent
     *   should do, or remember.  It should not overlap with the identityStatements though. */
    baseInstructions: PositionableMessage<StoredMessage>[];

    /** A list of plugin types for the plugins that the agent should have available. */
    plugins: PluginSpecification[];
}