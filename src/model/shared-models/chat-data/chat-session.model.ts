import { ObjectId } from "mongodb";


/** Represents a single chat session with message history and
 *   references to different memory data. */
export interface ChatSession {
    /** The ID of this chat session. */
    _id: ObjectId;

    
}