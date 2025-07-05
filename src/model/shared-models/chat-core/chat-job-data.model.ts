import { StoredMessage } from "@langchain/core/messages";
import { ObjectId } from "mongodb";
import { PluginSpecification } from "./plugin-specification.model";
import { PositionableMessage } from "./positionable-message.model";


/** This is a turn and a job that an agent must fulfill in a chat room during a round of chat interactions. */
export interface ChatJobConfiguration {
    /** Gets or sets the ID of the job, for the database. */
    _id: ObjectId;

    /** The ID of the project this chat job configuration belongs to. */
    projectId: ObjectId;

    /** Gets or sets the order that this job gets executed in the execution order. */
    order: number;

    /** A name for this chat job, to uniquely identify it in the UI and debugging. */
    name: string;

    /** Gets or sets a boolean value indicating whether or not this
     *   job is disabled, skipping its turn in the process. */
    disabled: boolean;

    /** The ID of the agent that must fulfill this job. */
    agentId: ObjectId | undefined;

    /** The instructions to be given to the agent for them to fulfil the job. */
    instructions: PositionableMessage<StoredMessage>[];

    /** A set of plugins that can be used for this job. 
     *   Only plugins that have no contexts can be used in
     *   chat jobs. */
    plugins: PluginSpecification[];
}