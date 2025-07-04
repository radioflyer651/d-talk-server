import { ObjectId } from "mongodb";

export interface User {
    _id: ObjectId;
    userName: string;
    email: string;
    isAdmin?: boolean;
    displayName?: string;
}