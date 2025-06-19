import { ObjectId } from "mongodb";


/** The "container" for an entire dataset, of related chat data.
 *   Projects belong to users. */
export interface Project {
    /** The ID of this project. */
    _id: ObjectId;

    /** The ID of the user who owns this project. */
    userId: ObjectId;

    /** Gets or sets the name of this project to help identify it. */
    name: string;

    
}