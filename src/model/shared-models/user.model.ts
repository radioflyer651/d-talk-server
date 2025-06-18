import { ObjectId } from "mongodb";

export interface User {
    _id: ObjectId;
    userName: string;
    companyId: ObjectId;
    isAdmin?: boolean;
    displayName?: string;
}