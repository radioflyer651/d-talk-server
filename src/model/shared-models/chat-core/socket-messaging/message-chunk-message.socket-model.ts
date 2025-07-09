import { ObjectId } from "mongodb";

export const MESSAGE_CHUNK_MESSAGE = 'message-chunk';

/** Sent when a chunk of an AI message is generated during LLM invocation.  This is
 *   a streamed value, from the LLM.  */
export interface MessageChunkMessage {
    chatRoomId: ObjectId;
    messageId: string;
    chunk: string;
    speakerId: ObjectId;
    speakerName: string;
}