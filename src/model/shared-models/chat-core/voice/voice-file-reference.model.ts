import { ObjectId } from "mongodb";
import { AwsBucketObjectReference } from "../aws-bucket-object-reference.model";

/** Contains information about an LLM message that has been converted to voice. */
export interface VoiceFileReference {
    /** The ID of this reference. */
    _id: ObjectId;

    /** ID of the chat room this file belongs to.  This allows broader maintenance functions to be run on it. */
    chatRoomId: ObjectId;

    /** Contains the information about the bucket and the blob that stores this data. */
    awsBucketInfo: AwsBucketObjectReference;

    /** Gets or sets the date/time that this file started processing on the LLM. */
    processingDateTime: Date;

    /** Boolean value indicating whether or not this file was processed. */
    isProcessed: boolean;
}