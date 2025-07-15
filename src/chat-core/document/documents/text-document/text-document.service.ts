import { ObjectId } from "mongodb";
import { UpdateInfo } from "../../../../model/shared-models/chat-core/update-info.model";
import { ChatDocument } from "../../chat-document.service";
import { TextDocumentData } from "../../../../model/shared-models/chat-core/documents/document-types/text-document.model";
import { ChatDocumentDbService } from "../../../../database/chat-core/chat-document-db.service";
import { Agent } from "../../../agent/agent.service";
import { ChatCallInfo, IChatLifetimeContributor } from "../../../chat-lifetime-contributor.interface";
import { ChatJob } from "../../../chat-room/chat-job.service";
import { ChatRoom } from "../../../chat-room/chat-room.service";
import { StructuredToolInterface } from "@langchain/core/tools";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { BaseMessage, SystemMessage } from "@langchain/core/messages";
import { MessagePositionTypes, PositionableMessage } from "../../../../model/shared-models/chat-core/positionable-message.model";
import { createTextDocumentTools } from "./text-document-edit.tools";


export class TextDocument extends ChatDocument {
    constructor(
        data: TextDocumentData,
        documentDbService: ChatDocumentDbService,
    ) {
        super(data, documentDbService);
        this.splitLines();
    }

    declare data: TextDocumentData;

    /** The content of the document split into individual lines for easy editing. */
    content!: string[];

    protected splitLines() {
        this.content = this.data.content.split('\n');
    }

    protected updateDataContent() {
        this.data.content = this.content.join('\n');
    }

    /** Stores the data back to the database. */
    async commitToDb() {
        await this.documentDbService.updateDocument(this.data._id, this.data);
    }

    async getLifetimeContributors(chatRoom: ChatRoom, chatJob: ChatJob, chatAgent: Agent): Promise<IChatLifetimeContributor[]> {
        // Get the permissions.
        const permissions = this.determinePermissions(chatRoom, chatJob, chatAgent);

        const tools = createTextDocumentTools({
            agentId: chatAgent.identity._id,
            document: this,
            onContentChanged: async () => { },
            permissions: permissions,
        });

        return [new TextDocumentLifetimeContributor(this, tools)];
    }

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
        this.updateDataContent();
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
        this.updateDataContent();
    }

    /** Updates the entire content of the document. */
    updateContent(editorId: UpdateInfo, newContent: string) {
        this.data.content = newContent;
        this.content = newContent.split('\n');
        this.updateChangeInfo(editorId);
        this.updateDataContent();
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
    addComment(editorId: UpdateInfo, comment: { creator: ObjectId, content: string; }) {
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

    /** Inserts an array of new lines at a specified location in the content. */
    insertLines(editorId: UpdateInfo, startIndex: number, newLines: string[]) {
        if (!Array.isArray(newLines) || newLines.length === 0) {
            throw new Error('newLines must be a non-empty array of strings.');
        }

        if (startIndex < 0 || startIndex > this.content.length) {
            throw new Error('startIndex out of range.');
        }

        for (const line of newLines) {
            if (typeof line !== 'string') {
                throw new Error('All newLines must be strings.');
            }
        }

        this.content.splice(startIndex, 0, ...newLines);
        this.updateChangeInfo(editorId);
        this.updateDataContent();
    }

    /** Appends an array of new lines to the end of the content. */
    appendLines(editorId: UpdateInfo, newLines: string[]) {
        if (!Array.isArray(newLines) || newLines.length === 0) {
            throw new Error('newLines must be a non-empty array of strings.');
        }
        for (const line of newLines) {
            if (typeof line !== 'string') {
                throw new Error('All newLines must be strings.');
            }
        }
        this.content.push(...newLines);
        this.updateChangeInfo(editorId);
        this.updateDataContent();
    }
}

export class TextDocumentLifetimeContributor implements IChatLifetimeContributor {
    constructor(readonly document: TextDocument, readonly tools: (ToolNode | StructuredToolInterface)[]) {

    }

    async getTools(): Promise<(ToolNode | StructuredToolInterface)[]> {
        return this.tools;
    }

    async addPreChatMessages(info: ChatCallInfo): Promise<PositionableMessage<BaseMessage>[]> {
        if (info.replyNumber === 0) {
            return [
                {
                    location: MessagePositionTypes.AfterInstructions,
                    message: new SystemMessage(`
You have access to the document ${this.document.data.name} (ID: ${this.document.data._id.toString()}).  You have tools allowing you to work with it.
Below is the entire document:\n${JSON.stringify(this.document.data)}
                    `)
                }
            ];
        }

        return [];
    }
}