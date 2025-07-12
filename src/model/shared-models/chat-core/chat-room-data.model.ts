import { StoredMessage } from "@langchain/core/messages";
import { ObjectId } from "mongodb";
import { AgentReference } from "./agent-reference.model";
import { ChatJobInstance } from "./chat-job-instance.model";
import { PluginInstanceReference } from "./plugin-instance-reference.model";
import { PositionableMessage } from "./positionable-message.model";

export interface ChatRoomData {
    _id: ObjectId;

    /** The name of this chat room. */
    name: string;

    /** The ID of the project this chat room belongs to. */
    projectId: ObjectId;

    /** The ID of the user that owns this chat room. */
    userId: ObjectId;

    /** Boolean value indicating whether or not the chat room is
     *   currently busy, indicating that it's unable to accept
     *   user chat messages at the moment. */
    isBusy: boolean;

    /** A set of agent IDs that can contribute to jobs in the chat room. */
    agents: AgentReference[];

    /** A set of user IDs that can contribute to chat in this chat room.  (Owner is not included.) */
    userParticipants: ObjectId[];

    /** The chat messages for the room. */
    conversation: StoredMessage[];

    /** Messages/instructions to be used for all agents in the chat room. */
    roomInstructions: PositionableMessage<StoredMessage>[];
    
    /** A set of documents that are being worked on in this chat room. */
    documents: ObjectId[];

    /** Gets or sets the instances of chat jobs that are referenced by this chat room. */
    jobs: ChatJobInstance[];

    /** A set of log messages that may help in debugging. */
    logs: object[];

    /** Because chat rooms don't have "configurations" they will only have plugin
     *   instances.  They'll never have a matching PluginSpecification to match up to,
     *   but their instances will still have a specification of their own.  (The nested instance is the ONLY instance in this case.)     */
    plugins: PluginInstanceReference[];
}

