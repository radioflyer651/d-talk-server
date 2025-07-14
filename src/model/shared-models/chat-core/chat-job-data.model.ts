import { StoredMessage } from "@langchain/core/messages";
import { ObjectId } from "mongodb";
import { PluginSpecification } from "./plugin-specification.model";
import { PositionableMessage } from "./positionable-message.model";
import { ChatDocumentLinker } from "./documents/chat-document-reference.model";


/** This is a turn and a job that an agent must fulfill in a chat room during a round of chat interactions. */
export interface ChatJobConfiguration extends ChatDocumentLinker {
    /** Gets or sets the ID of the job, for the database. */
    _id: ObjectId;

    /** The ID of the project this chat job configuration belongs to. */
    projectId: ObjectId;

    /** Gets or sets the order that this job gets executed in the execution order. */
    order: number;

    /** A name for this chat job, to uniquely identify it in the UI and debugging. */
    name: string;

    /** The instructions to be given to the agent for them to fulfil the job. */
    instructions: PositionableMessage<StoredMessage>[];

    /** A set of plugins that can be used for this job. 
     *   Only plugins that have no contexts can be used in
     *   chat jobs. */
    plugins: PluginSpecification[];
}