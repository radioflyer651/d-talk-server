import { ObjectId } from "mongodb";

export interface TokenPayload {
    /** The name of the user. */
    name: string;

    /** The User ID (Object ID - probably a guid.) */
    userId?: ObjectId;

    /** Boolean value indicating whether or not the associated user is an admin user. */
    isAdmin?: boolean;
}
