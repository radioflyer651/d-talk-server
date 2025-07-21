import { ObjectId } from "mongodb";
import { UpdateInfo } from "../update-info.model";

export interface IChatDocumentData {
    /** The DB Id of this document. */
    _id: ObjectId;

    /** Gets or sets the type of document this is. */
    type: string;

    /** Gets or sets a name for this document, so it can be easily identified. */
    name: string;

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

    /** Gets or sets the description of this document.  This should inform users/agents
     *   of what to use the document for, and why it should be changed, etc. */
    description: string;

}

export type IChatDocumentListItem = Pick<IChatDocumentData, 'name' | 'type' | 'folderLocation' | 'folderLocation' | 'description' | 'projectId' | '_id'>;

export type IChatDocumentCreationParams = Pick<IChatDocumentData, 'name' | 'type' | 'folderLocation' | 'folderLocation' | 'description' | 'projectId' | 'lastChangedBy'>;