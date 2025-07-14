import { ObjectId } from "mongodb";
import { ChatDocumentData } from "../../model/shared-models/chat-core/chat-document.model";
import { UpdateInfo } from "../../model/shared-models/chat-core/update-info.model";


export class ChatDocument {
    constructor(
        readonly data: ChatDocumentData,
    ) {
        this.content = data.content.split('\n');
    }

    /** The content of the document split into individual lines for easy editing. */
    content: string[];

    updateChangeInfo(updatedBy: { entityType: 'user' | 'agent', id: ObjectId; }) {
        this.data.lastChangedBy = updatedBy;
        this.data.updatedDate = new Date();
    }

    /** Ensures a specified line number is within range of the number of lines in the content,
     *   and throws an error if it is not. */
    private validateLineNumber(lineNumber: number) {
        if (lineNumber < 0 || lineNumber > this.content.length) {
            throw new Error(`lineNumber out of range.`);
        }
    }

    editLine(editorId: UpdateInfo, lineNumber: number, newContent: string) {
        this.validateLineNumber(lineNumber);

        if (!(typeof newContent === 'string')) {
            throw new Error(`newContent must be a string.`);
        }

        this.content[lineNumber] = newContent;

        this.updateChangeInfo(editorId);
    }

    /** Deletes a specified number of lines from the document. */
    deleteLines(editorId: UpdateInfo, lineNumbers: number[]) {
        // Validate the line numbers.
        if (lineNumbers.some(ln => ln < 0 || ln > this.content.length - 1)) {
            throw new Error(`1 or more line numbers are out of range.`);
        }

        // Put the lines in reverse order, so the line numbers don't change as we delete them.
        lineNumbers.sort((v1, v2) => v1 - v2);
        lineNumbers.reverse();

        // Delete the lines.
        lineNumbers.forEach(l => {
            this.content.splice(l, 1);
        });

        this.updateChangeInfo(editorId);
    }

    /** Updates the entire content of the document. */
    updateContent(editorId: UpdateInfo, newContent: string) {
        this.data.content = newContent;
        this.updateChangeInfo(editorId);
    }

    /** Updates the name of the document. */
    updateName(editorId: UpdateInfo, newName: string) {
        if (typeof newName !== 'string' || !newName.trim()) {
            throw new Error('newName must be a non-empty string.');
        }
        this.data.name = newName;
        this.updateChangeInfo(editorId);
    }

    /** Updates the description of the document. */
    updateDescription(editorId: UpdateInfo, newDescription: string) {
        if (typeof newDescription !== 'string') {
            throw new Error('newDescription must be a string.');
        }
        this.data.description = newDescription;
        this.updateChangeInfo(editorId);
    }

    /** Adds a new comment to the document. */
    addComment(editorId: UpdateInfo, comment: { creator: ObjectId, content: string }) {
        if (typeof comment.content !== 'string' || !comment.content.trim()) {
            throw new Error('Comment content must be a non-empty string.');
        }
        const newComment = {
            creator: comment.creator,
            createdDate: new Date(),
            updatedDate: new Date(),
            content: comment.content
        };
        this.data.comments.push(newComment);
        this.updateChangeInfo(editorId);
    }

    /** Edits an existing comment by index. */
    editComment(editorId: UpdateInfo, commentIndex: number, newContent: string) {
        if (commentIndex < 0 || commentIndex >= this.data.comments.length) {
            throw new Error('Comment index out of range.');
        }
        if (typeof newContent !== 'string' || !newContent.trim()) {
            throw new Error('newContent must be a non-empty string.');
        }
        this.data.comments[commentIndex].content = newContent;
        this.data.comments[commentIndex].updatedDate = new Date();
        this.updateChangeInfo(editorId);
    }

    /** Deletes a comment by index. */
    deleteComment(editorId: UpdateInfo, commentIndex: number) {
        if (commentIndex < 0 || commentIndex >= this.data.comments.length) {
            throw new Error('Comment index out of range.');
        }
        this.data.comments.splice(commentIndex, 1);
        this.updateChangeInfo(editorId);
    }
}

