import { BaseMessage, StoredMessage } from "@langchain/core/messages";
import { ObjectId } from "mongodb";
import { ChatJobData } from "./chat-job-data.model";

export interface ChatRoomData {
    _id: ObjectId;

    /** The name of this chat room. */
    name: string;

    /** The ID of the user that owns this chat room. */
    userId: ObjectId;

    /** Boolean value indicating whether or not the chat room is
     *   currently busy, indicating that it's unable to accept
     *   user chat messages at the moment. */
    isBusy: boolean;

    /** A set of agent IDs that can contribute to jobs in the chat room. */
    agents: ObjectId[];

    /** A set of user IDs that can contribute to chat in this chat room.  (Owner is not included.) */
    userParticipants: ObjectId[];

    /** The chat messages for the room. */
    conversation: StoredMessage[];

    /** A set of documents that are being worked on in this chat room. */
    documents: ObjectId[];

    /** Gets or sets a list of chat jobs, which are interactions that occur
     *   in a chat room by agents with every interaction by the user. */
    jobs: ChatJobData[];

    /** A set of log messages that may help in debugging. */
    logs: object[];
}

