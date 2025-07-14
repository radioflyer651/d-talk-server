import { ObjectId } from "mongodb";
import { UpdateInfo } from "./update-info.model";

export interface ChatDocumentData {
    /** The DB Id of this document. */
    _id: ObjectId;

    /** A "path" that this document is located in.  No actual "folder" exists for a document,
     *   but this helps logically organize document data. */
    folderLocation: string;

    /** The ID of the project that this document belongs to. */
    projectId: ObjectId;

    /** The time/date that this document was created. */
    createdDate: Date;

    /** The time/date that this document was updated. */
    updatedDate: Date;

    /** Gets sets the ID of the user or agent that last changed this document. */
    lastChangedBy: UpdateInfo;

    /** Gets or sets a name for this document, so it can be easily identified. */
    name: string;

    /** This is the content of the document. */
    content: string;

    /** Gets or sets the description of this document.  This should inform users/agents
     *   of what to use the document for, and why it should be changed, etc. */
    description: string;

    /** Arbitrary comments about the document. */
    comments: ChatDocumentComment[];
}

export interface ChatDocumentComment {
    /** The ID of the agent or user who created this comment. */
    creator: ObjectId;

    /** The time/date that this comment was created. */
    createdDate: Date;

    /** The time/date that this comment was updated. */
    updatedDate: Date;

    /** The content of the comment. */
    content: string;
}