import { ObjectId } from "mongodb";

/**
 * Represents a record of a database update/migration that has been executed.
 */
export interface DatabaseUpdateInfo {
    /** Optional MongoDB identifier when stored. */
    _id?: ObjectId;

    /** The unique name of the update (idempotency key). */
    name: string;

    /** The timestamp when this update was executed. */
    dateExecuted: Date; // Using Date object to represent DateTime
}
