import { z } from "zod";
import { ChatDocument } from "./chat-document.service";
import { StructuredToolInterface, tool } from "@langchain/core/tools";
import { ObjectId } from "mongodb";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatDocumentPermissions } from "../../model/shared-models/chat-core/chat-document-permissions.model";

const orderOfOpsNote = `IMPORTANT: If deleting lines and editing lines, do the deletions first, and then make a separate call later to update lines, since the line numbers will change after deletions.`;

export interface DocumentFunctionInfo {
    document: ChatDocument;
    agentId: ObjectId;
    permissions: ChatDocumentPermissions;
    onContentChanged: () => Promise<void>;
}

export function createEditDocumentLinesTool(info: DocumentFunctionInfo) {
    const document = info.document;
    const data = info.document.data;

    const editDocumentSchema = {
        name: 'edit_document_lines_' + data._id.toString(),
        description: `Edits lines on the document ${data.name} (id: ${data._id.toString()})\n${orderOfOpsNote}`,
        schema: z.object({
            lines: z.array(z.object({
                lineNumber: z.number().int(),
                newContent: z.string()
            }))
        })
    };

    return tool(
        async (options: z.infer<typeof editDocumentSchema.schema>) => {
            options.lines.forEach(l => {
                document.editLine({ entityType: 'agent', id: info.agentId }, l.lineNumber, l.newContent);
            });

            info.onContentChanged();
        },
        editDocumentSchema
    );
}

export function createDeleteDocumentLinesTool(info: DocumentFunctionInfo) {
    const document = info.document;
    const data = info.document.data;

    const deleteLineSchema = {
        name: 'delete_document_lines_' + data._id.toString(),
        description: `Edits lines on the document ${data.name} (id: ${data._id.toString()})\n${orderOfOpsNote}`,
        schema: z.object({
            lines: z.array(z.number().int())
        })
    };

    return tool(
        async (options: z.infer<typeof deleteLineSchema.schema>) => {
            document.deleteLines({ entityType: 'agent', id: info.agentId }, options.lines);
            info.onContentChanged();
        },
        deleteLineSchema
    );
}


export function createEditDocumentContentTool(info: DocumentFunctionInfo) {
    const document = info.document;
    const data = info.document.data;

    const deleteLineSchema = {
        name: 'edit_document_full_content' + data._id.toString(),
        description: `Replaces the entire content of the document ${data.name} (id: ${data._id.toString()})\n${orderOfOpsNote}`,
        schema: z.object({
            newContent: z.string()
        })
    };

    return tool(
        async (options: z.infer<typeof deleteLineSchema.schema>) => {
            document.updateContent({ entityType: 'agent', id: info.agentId }, options.newContent);
            info.onContentChanged();
        },
        deleteLineSchema
    );
}

export function createEditDocumentNameTool(info: DocumentFunctionInfo) {
    const document = info.document;
    const data = info.document.data;

    const schema = {
        name: 'edit_document_name_' + data._id.toString(),
        description: `Updates the name of the document ${data.name} (id: ${data._id.toString()})`,
        schema: z.object({
            newName: z.string()
        })
    };

    return tool(
        async (options: z.infer<typeof schema.schema>) => {
            document.updateName({ entityType: 'agent', id: info.agentId }, options.newName);
            info.onContentChanged();
        },
        schema
    );
}

export function createEditDocumentDescriptionTool(info: DocumentFunctionInfo) {
    const document = info.document;
    const data = info.document.data;

    const schema = {
        name: 'edit_document_description_' + data._id.toString(),
        description: `Updates the description of the document ${data.name} (id: ${data._id.toString()})`,
        schema: z.object({
            newDescription: z.string()
        })
    };

    return tool(
        async (options: z.infer<typeof schema.schema>) => {
            document.updateDescription({ entityType: 'agent', id: info.agentId }, options.newDescription);
            info.onContentChanged();
        },
        schema
    );
}

export function createAddDocumentCommentTool(info: DocumentFunctionInfo) {
    const document = info.document;
    const data = info.document.data;

    const schema = {
        name: 'add_document_comment_' + data._id.toString(),
        description: `Adds a comment to the document ${data.name} (id: ${data._id.toString()})`,
        schema: z.object({
            creator: z.string(), // ObjectId as string
            content: z.string()
        })
    };

    return tool(
        async (options: z.infer<typeof schema.schema>) => {
            document.addComment(
                { entityType: 'agent', id: info.agentId },
                { creator: new ObjectId(options.creator), content: options.content }
            );
            info.onContentChanged();
        },
        schema
    );
}

export function createEditDocumentCommentTool(info: DocumentFunctionInfo) {
    const document = info.document;
    const data = info.document.data;

    const schema = {
        name: 'edit_document_comment_' + data._id.toString(),
        description: `Edits a comment on the document ${data.name} (id: ${data._id.toString()})`,
        schema: z.object({
            commentIndex: z.number().int(),
            newContent: z.string()
        })
    };

    return tool(
        async (options: z.infer<typeof schema.schema>) => {
            document.editComment(
                { entityType: 'agent', id: info.agentId },
                options.commentIndex,
                options.newContent
            );
            info.onContentChanged();
        },
        schema
    );
}

export function createDeleteDocumentCommentTool(info: DocumentFunctionInfo) {
    const document = info.document;
    const data = info.document.data;

    const schema = {
        name: 'delete_document_comment_' + data._id.toString(),
        description: `Deletes a comment from the document ${data.name} (id: ${data._id.toString()})`,
        schema: z.object({
            commentIndex: z.number().int()
        })
    };

    return tool(
        async (options: z.infer<typeof schema.schema>) => {
            document.deleteComment(
                { entityType: 'agent', id: info.agentId },
                options.commentIndex
            );
            info.onContentChanged();
        },
        schema
    );
}

export function createInsertDocumentLinesTool(info: DocumentFunctionInfo) {
    const document = info.document;
    const data = info.document.data;

    const schema = {
        name: 'insert_document_lines_' + data._id.toString(),
        description: `Inserts new lines into the document ${data.name} (id: ${data._id.toString()}) at a specified index.`,
        schema: z.object({
            startIndex: z.number().int(),
            newLines: z.array(z.string())
        })
    };

    return tool(
        async (options: z.infer<typeof schema.schema>) => {
            document.insertLines(
                { entityType: 'agent', id: info.agentId },
                options.startIndex,
                options.newLines
            );
            await info.onContentChanged();
        },
        schema
    );
}

export function createAppendDocumentLinesTool(info: DocumentFunctionInfo) {
    const document = info.document;
    const data = info.document.data;

    const schema = {
        name: 'append_document_lines_' + data._id.toString(),
        description: `Appends new lines to the end of the document ${data.name} (id: ${data._id.toString()}).`,
        schema: z.object({
            newLines: z.array(z.string())
        })
    };

    return tool(
        async (options: z.infer<typeof schema.schema>) => {
            document.appendLines(
                { entityType: 'agent', id: info.agentId },
                options.newLines
            );
            await info.onContentChanged();
        },
        schema
    );
}

/** Returns the tools required to edit/modify document information. */
export function createEditDocumentTools(info: DocumentFunctionInfo) {
    const perms = info.permissions || {};
    const result: (ToolNode | StructuredToolInterface)[] = [];

    if (perms.canEdit) {
        result.push(createEditDocumentContentTool(info));
        result.push(createDeleteDocumentLinesTool(info));
        result.push(createEditDocumentLinesTool(info));
        result.push(createInsertDocumentLinesTool(info));
        result.push(createAppendDocumentLinesTool(info));
    }

    if (perms.canChangeName) {
        result.push(createEditDocumentNameTool(info));
    }

    if (perms.canUpdateDescription) {
        result.push(createEditDocumentDescriptionTool(info));
    }

    if (perms.canUpdateComments) {
        result.push(createAddDocumentCommentTool(info));
        result.push(createEditDocumentCommentTool(info));
        result.push(createDeleteDocumentCommentTool(info));
    }

    return result;
}