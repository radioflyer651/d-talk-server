import { ObjectId } from "mongodb";


export interface UpdateInfo {
    /** The type of entity that updated the related information. */
    entityType: 'user' | 'agent';

    /** The ID of the entity that updated the related info. */
    id: ObjectId;
}