import { ObjectId } from "mongodb";
import { IChatDocumentData } from "../chat-document.model";
import { TEXT_DOCUMENT_TYPE } from "../document-type.constants";

export interface TextDocumentData extends IChatDocumentData {
    type: typeof TEXT_DOCUMENT_TYPE;

    /** This is the content of the document. */
    content: string;

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
