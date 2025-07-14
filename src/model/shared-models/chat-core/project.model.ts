import { ObjectId } from "mongodb";
import { PositionableMessage } from "./positionable-message.model";
import { StoredMessage } from "@langchain/core/messages";
import { ChatDocumentLinker } from "./chat-document-reference.model";


/** The "container" for an entire dataset, of related chat data.
 *   Projects belong to users. */
export interface Project extends ChatDocumentLinker {
    /** The ID of this project. */
    _id: ObjectId;

    /** The ID of the user who owns this project. */
    creatorId: ObjectId;

    /** Gets or sets the name of this project to help identify it. */
    name: string;

    /** A description of this project's purpose, if any. */
    description: string;

    /** Gets or sets the list of project knowledge items that can be used in agents, roles, or rooms. */
    projectKnowledge: PositionableMessage<StoredMessage>[];
}