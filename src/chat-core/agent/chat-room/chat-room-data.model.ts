import { BaseMessage } from "@langchain/core/messages";
import { ObjectId } from "mongodb";
import { ChatJobData } from "./chat-job-data.model";

export interface ChatRoomData {
    _id: ObjectId;

    name: string;

    userId: ObjectId;

    /** Boolean value indicating whether or not the chat room is
     *   currently busy, indicating that it's unable to accept
     *   user chat messages at the moment. */
    isBusy: boolean;

    agents: ObjectId[];

    /** The chat messages for the room. */
    conversation: BaseMessage[];

    /** A set of documents that are being worked on in this chat room. */
    documents: ObjectId[];

    /** Gets or sets a list of chat jobs, which are interactions that occur
     *   in a chat room by agents with every interaction by the user. */
    jobs: ChatJobData[];
}

