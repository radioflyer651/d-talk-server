import { ObjectId } from "mongodb";
import { UserPermission } from "./user.model";

export interface TokenPayload {
    /** The name of the user. */
    name: string;

    /** The User ID (Object ID - probably a guid.) */
    userId?: ObjectId;

    /** Boolean value indicating whether or not the associated user is an admin user. */
    isAdmin?: boolean;

    /** The permissions the user has. */
    permissions?: UserPermission;
}
