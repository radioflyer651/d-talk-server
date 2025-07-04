import { ObjectId } from "mongodb";

/** Stores sensitive user authentication data (hashed password, etc). */
export interface UserSecrets {
    _id: ObjectId;         // Should match the User's _id
    passwordHash: string;  // Store hashed password, never plain text!
    createdAt: Date;
    updatedAt?: Date;
}
