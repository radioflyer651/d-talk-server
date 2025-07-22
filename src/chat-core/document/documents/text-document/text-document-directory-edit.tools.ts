import { z } from "zod";
import { StructuredToolInterface, tool } from "@langchain/core/tools";
import { ObjectId } from "mongodb";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatDirectoryPermissions } from "../../../../model/shared-models/chat-core/documents/chat-document-permissions.model";
import { generalDocumentInstructions } from "../../general-document-instructions.constants";
import { TextDocumentResolver } from "../../resolvers/text-document.resolver";
import { ChatDocumentDbService } from "../../../../database/chat-core/chat-document-db.service";
import { TextDocumentData } from "../../../../model/shared-models/chat-core/documents/document-types/text-document.model";
import { NewDbItem } from "../../../../model/shared-models/db-operation-types.model";
import { TextDocument } from "./text-document.service";



const commonNotes = `IMPORTANT: If deleting lines and editing lines, ALWAYS do the deletions FIRST, and then make a separate call later to update lines, since the line numbers will change after deletions.\n` +
    `After edits occur, the future message histories will reflect the newest version of the document, removing old versions from the chat history.\n` +
    generalDocumentInstructions;

function getExclusiveFolderInstructionText(permission: ChatDirectoryPermissions) {
    return `These functions work ONLY on the folderLocation ${permission.rootFolder} and its documents and sub-folders.  It does NOT work outside of this folderLocation.`;
}

export interface ManageDocumentFolderFunctionInfo {
    pluginId: ObjectId;
    textDocumentResolver: TextDocumentResolver;
    chatDocumentDbService: ChatDocumentDbService;
    agentId: ObjectId;
    projectId: ObjectId;
    permissions: ChatDirectoryPermissions;
    onContentChanged: () => Promise<void>;
}

/** Verifies whether or not a specified tool call includes the folder path allowed by a specified permission set. 
 *   If not, throws an error. */
function callHasFolderAccess(document: TextDocument, permissions: ChatDirectoryPermissions) {
    if (!(permissions.rootFolder.trim() === '' || document.data.folderLocation.trim().toLowerCase().startsWith(permissions.rootFolder.trim().toLocaleLowerCase()))) {
        throw new Error(`Permissions only allow access to the folderLocation ${permissions.rootFolder} and sub folders.  The document attempting to be manipulated is in the ${document.data.folderLocation} folder.  Please verify that the document you're working with has a folderLocation inside this location.`);
    }
}


function createEditDocumentLinesTool(info: ManageDocumentFolderFunctionInfo) {
    const editDocumentSchema = {
        name: 'edit_document_lines_' + info.pluginId.toString(),
        description: `Edits the lines of a specified document ID, for documents inside the ${info.permissions.rootFolder} folder or sub-folders.\n${commonNotes}`,
        schema: z.object({
            documentId: z.string(),
            lines: z.array(z.object({
                lineNumber: z.number().int(),
                newContent: z.string()
            }))
        })
    };

    return tool(
        async (options: z.infer<typeof editDocumentSchema.schema>) => {
            if (info.permissions?.debugMode) {
                console.log('edit_document_lines_' + info.pluginId.toString());
            }

            const documentData = await info.chatDocumentDbService.getDocumentById(new ObjectId(options.documentId)) as TextDocumentData;
            const document = await info.textDocumentResolver.hydrateDocument(documentData, info.chatDocumentDbService);

            callHasFolderAccess(document, info.permissions!);

            options.lines.forEach(l => {
                document.editLine({ entityType: 'agent', id: info.agentId }, l.lineNumber, l.newContent);
            });
            await document.commitToDb();
            info.onContentChanged();
            return 'Document lines edited successfully.';
        },
        editDocumentSchema
    );
}

function createDeleteDocumentLinesTool(info: ManageDocumentFolderFunctionInfo) {
    const deleteLineSchema = {
        name: 'delete_document_lines_' + info.pluginId.toString(),
        description: `Deletes lines on the specified document ID.${getExclusiveFolderInstructionText(info.permissions)}.\n${commonNotes}`,
        schema: z.object({
            documentId: z.string(),
            lines: z.array(z.number().int())
        })
    };

    return tool(
        async (options: z.infer<typeof deleteLineSchema.schema>) => {
            if (info.permissions?.debugMode) {
                console.log('delete_document_lines_' + info.pluginId.toString());
            }

            const documentData = await info.chatDocumentDbService.getDocumentById(new ObjectId(options.documentId)) as TextDocumentData;
            const document = await info.textDocumentResolver.hydrateDocument(documentData, info.chatDocumentDbService);

            callHasFolderAccess(document, info.permissions!);

            document.deleteLines({ entityType: 'agent', id: info.agentId }, options.lines);
            await document.commitToDb();
            info.onContentChanged();
            return 'Document lines deleted successfully.';
        },
        deleteLineSchema
    );
}

function createEditDocumentContentTool(info: ManageDocumentFolderFunctionInfo) {
    const editContentSchema = {
        name: 'edit_document_full_content_' + info.pluginId.toString(),
        description: `Replaces the entire content of the specified document ID.${getExclusiveFolderInstructionText(info.permissions)}.\n${commonNotes}`,
        schema: z.object({
            documentId: z.string(),
            newContent: z.string()
        })
    };

    return tool(
        async (options: z.infer<typeof editContentSchema.schema>) => {
            if (info.permissions?.debugMode) {
                console.log('edit_document_full_content_' + info.pluginId.toString());
            }
            const documentData = await info.chatDocumentDbService.getDocumentById(new ObjectId(options.documentId)) as TextDocumentData;
            const document = await info.textDocumentResolver.hydrateDocument(documentData, info.chatDocumentDbService);

            callHasFolderAccess(document, info.permissions!);

            document.updateContent({ entityType: 'agent', id: info.agentId }, options.newContent);
            await document.commitToDb();
            info.onContentChanged();
            return 'Document content updated successfully.';
        },
        editContentSchema
    );
}

function createEditDocumentNameTool(info: ManageDocumentFolderFunctionInfo) {
    const editNameSchema = {
        name: 'edit_document_name_' + info.pluginId.toString(),
        description: `Updates the name of the specified document ID.${getExclusiveFolderInstructionText(info.permissions)}.`,
        schema: z.object({
            documentId: z.string(),
            newName: z.string()
        })
    };

    return tool(
        async (options: z.infer<typeof editNameSchema.schema>) => {
            if (info.permissions?.debugMode) {
                console.log('edit_document_name_' + info.pluginId.toString());
            }
            const documentData = await info.chatDocumentDbService.getDocumentById(new ObjectId(options.documentId)) as TextDocumentData;
            const document = await info.textDocumentResolver.hydrateDocument(documentData, info.chatDocumentDbService);

            callHasFolderAccess(document, info.permissions!);

            document.updateName({ entityType: 'agent', id: info.agentId }, options.newName);
            await document.commitToDb();
            info.onContentChanged();
            return 'Document name updated successfully.';
        },
        editNameSchema
    );
}

function createEditDocumentDescriptionTool(info: ManageDocumentFolderFunctionInfo) {
    const editDescriptionSchema = {
        name: 'edit_document_description_' + info.pluginId.toString(),
        description: `Updates the description of the specified document ID.${getExclusiveFolderInstructionText(info.permissions)}.`,
        schema: z.object({
            documentId: z.string(),
            newDescription: z.string()
        })
    };

    return tool(
        async (options: z.infer<typeof editDescriptionSchema.schema>) => {
            if (info.permissions?.debugMode) {
                console.log('edit_document_description_' + info.pluginId.toString());
            }
            const documentData = await info.chatDocumentDbService.getDocumentById(new ObjectId(options.documentId)) as TextDocumentData;
            const document = await info.textDocumentResolver.hydrateDocument(documentData, info.chatDocumentDbService);

            callHasFolderAccess(document, info.permissions!);

            document.updateDescription({ entityType: 'agent', id: info.agentId }, options.newDescription);
            await document.commitToDb();
            info.onContentChanged();
            return 'Document description updated successfully.';
        },
        editDescriptionSchema
    );
}

function createAddDocumentCommentTool(info: ManageDocumentFolderFunctionInfo) {
    const addCommentSchema = {
        name: 'add_document_comment_' + info.pluginId.toString(),
        description: `Adds a comment to the specified document ID.${getExclusiveFolderInstructionText(info.permissions)}.`,
        schema: z.object({
            documentId: z.string(),
            creator: z.string(), // ObjectId as string
            content: z.string()
        })
    };

    return tool(
        async (options: z.infer<typeof addCommentSchema.schema>) => {
            if (info.permissions?.debugMode) {
                console.log('add_document_comment_' + info.pluginId.toString());
            }
            const documentData = await info.chatDocumentDbService.getDocumentById(new ObjectId(options.documentId)) as TextDocumentData;
            const document = await info.textDocumentResolver.hydrateDocument(documentData, info.chatDocumentDbService);

            callHasFolderAccess(document, info.permissions!);

            document.addComment(
                { entityType: 'agent', id: info.agentId },
                { creator: new ObjectId(options.creator), content: options.content }
            );
            await document.commitToDb();
            info.onContentChanged();
            return 'Comment added successfully.';
        },
        addCommentSchema
    );
}

function createEditDocumentCommentTool(info: ManageDocumentFolderFunctionInfo) {
    const editCommentSchema = {
        name: 'edit_document_comment_' + info.pluginId.toString(),
        description: `Edits a comment on the specified document ID.${getExclusiveFolderInstructionText(info.permissions)}.`,
        schema: z.object({
            documentId: z.string(),
            commentIndex: z.number().int(),
            newContent: z.string()
        })
    };

    return tool(
        async (options: z.infer<typeof editCommentSchema.schema>) => {
            if (info.permissions?.debugMode) {
                console.log('edit_document_comment_' + info.pluginId.toString());
            }
            const documentData = await info.chatDocumentDbService.getDocumentById(new ObjectId(options.documentId)) as TextDocumentData;
            const document = await info.textDocumentResolver.hydrateDocument(documentData, info.chatDocumentDbService);

            callHasFolderAccess(document, info.permissions!);

            document.editComment(
                { entityType: 'agent', id: info.agentId },
                options.commentIndex,
                options.newContent
            );
            await document.commitToDb();
            info.onContentChanged();
            return 'Comment edited successfully.';
        },
        editCommentSchema
    );
}

function createDeleteDocumentCommentTool(info: ManageDocumentFolderFunctionInfo) {
    const deleteCommentSchema = {
        name: 'delete_document_comment_' + info.pluginId.toString(),
        description: `Deletes a comment from the specified document ID.${getExclusiveFolderInstructionText(info.permissions)}.`,
        schema: z.object({
            documentId: z.string(),
            commentIndex: z.number().int()
        })
    };

    return tool(
        async (options: z.infer<typeof deleteCommentSchema.schema>) => {
            if (info.permissions?.debugMode) {
                console.log('delete_document_comment_' + info.pluginId.toString());
            }
            const documentData = await info.chatDocumentDbService.getDocumentById(new ObjectId(options.documentId)) as TextDocumentData;
            const document = await info.textDocumentResolver.hydrateDocument(documentData, info.chatDocumentDbService);

            callHasFolderAccess(document, info.permissions!);

            document.deleteComment(
                { entityType: 'agent', id: info.agentId },
                options.commentIndex
            );
            await document.commitToDb();
            info.onContentChanged();
            return 'Comment deleted successfully.';
        },
        deleteCommentSchema
    );
}

function createInsertDocumentLinesTool(info: ManageDocumentFolderFunctionInfo) {
    const insertLinesSchema = {
        name: 'insert_document_lines_' + info.pluginId.toString(),
        description: `Inserts new lines into the specified document ID at a specified index.${getExclusiveFolderInstructionText(info.permissions)}.`,
        schema: z.object({
            documentId: z.string(),
            startIndex: z.number().int(),
            newLines: z.array(z.string())
        })
    };

    return tool(
        async (options: z.infer<typeof insertLinesSchema.schema>) => {
            if (info.permissions?.debugMode) {
                console.log('insert_document_lines_' + info.pluginId.toString());
            }
            const documentData = await info.chatDocumentDbService.getDocumentById(new ObjectId(options.documentId)) as TextDocumentData;
            const document = await info.textDocumentResolver.hydrateDocument(documentData, info.chatDocumentDbService);

            callHasFolderAccess(document, info.permissions!);

            document.insertLines(
                { entityType: 'agent', id: info.agentId },
                options.startIndex,
                options.newLines
            );
            await document.commitToDb();
            await info.onContentChanged();
            return 'Document lines inserted successfully.';
        },
        insertLinesSchema
    );
}

function createAppendDocumentLinesTool(info: ManageDocumentFolderFunctionInfo) {
    const appendLinesSchema = {
        name: 'append_document_lines_' + info.pluginId.toString(),
        description: `Appends new lines to the end of the specified document ID.${getExclusiveFolderInstructionText(info.permissions)}.`,
        schema: z.object({
            documentId: z.string(),
            newLines: z.array(z.string())
        })
    };

    return tool(
        async (options: z.infer<typeof appendLinesSchema.schema>) => {
            if (info.permissions?.debugMode) {
                console.log('append_document_lines_' + info.pluginId.toString());
            }
            const documentData = await info.chatDocumentDbService.getDocumentById(new ObjectId(options.documentId)) as TextDocumentData;
            const document = await info.textDocumentResolver.hydrateDocument(documentData, info.chatDocumentDbService);

            callHasFolderAccess(document, info.permissions!);

            document.appendLines(
                { entityType: 'agent', id: info.agentId },
                options.newLines
            );
            await document.commitToDb();
            await info.onContentChanged();
            return 'Document lines appended successfully.';
        },
        appendLinesSchema
    );
}

// ----------------------------
function getCommonInstructions(params: ManageDocumentFolderFunctionInfo): string {
    return `
Creates a new text document (also called a "file" sometimes), which may be ANY form of text file (HTML, plain text, JSON, etc) in the folder ${params.permissions.rootFolder}. 
After the document is created, you can edit the document through another tool call.
When creating new document, be sure to include detailed descriptions, indicating what the content of the document is for, and when to edit it.
Do not attempt to provide links to new documents.  They won't work.
Keep document names short, and use spaces.  These are not file names.
Folder path formats are 'folder1/folder2/folder3'.
${generalDocumentInstructions}
${params.permissions.instructions}
`;
}

function getCreateRegularDocumentsTools(params: ManageDocumentFolderFunctionInfo) {
    const createDocumentSchema = {
        name: `create_text_document_${params.pluginId.toString()}`,
        description: getCommonInstructions(params),
        schema: z.object({
            fileName: z.string().describe(`The name of the file you're creating.`),
            description: z.string().describe(`This is a description of what this file is, and what it's for.  If the description also has instructions, those instructions are provided to any LLM agent using the file as a system message as well.`),
            content: z.string().describe(`The content of the document.`),
        })
    };
    const createDocumentTool = tool(
        async (options: z.infer<typeof createDocumentSchema.schema>) => {
            // Create the document.
            const newTextDocument = <NewDbItem<TextDocumentData>>{
                name: options.fileName,
                type: 'text',
                content: options.content,
                comments: [],
                description: options.description,
                folderLocation: params.permissions.rootFolder,
                projectId: params.projectId,
                lastChangedBy: { entityType: 'agent', id: params.agentId },
                createdDate: new Date(),
                updatedDate: new Date,
            };

            // Add it to the database.
            const dbDocument = await params.chatDocumentDbService.createDocument(newTextDocument);
            return `A new document with the id ${dbDocument._id.toString()} was created with the name of ${newTextDocument.name}.`;
        },
        createDocumentSchema
    );

    return createDocumentTool;
}

function getCreateDocumentsAndFoldersTools(params: ManageDocumentFolderFunctionInfo) {
    const createDocumentInFolderSchema = {
        name: `create_text_document_${params.pluginId.toString()}`,
        description: getCommonInstructions(params),
        schema: z.object({
            fileName: z.string().describe(`The name of the file you're creating.`),
            subFolder: z.string().describe(`The sub folder of ${params.permissions.rootFolder}, IF ANY, to add the document to.  If placing it in the current root, then leave this an empty string.`),
            description: z.string().describe(`This is a description of what this file is, and what it's for.  If the description also has instructions, those instructions are provided to any LLM agent using the file as a system message as well.`),
            content: z.string().describe(`The content of the document.`),
        })
    };

    function combineFolders(root: string, subFolder: string): string {
        // Ensures there are no leading/trailing slashes or whitespace.
        function conditionPathPart(val: string) {
            val = val.trim();

            if (val.endsWith('/')) {
                val = val.substring(0, val.length - 1);
            }

            if (val.startsWith('/')) {
                val = val.substring(1);
            }

            return val;
        }

        // Condition the two parts.
        root = conditionPathPart(root);
        subFolder = conditionPathPart(subFolder);

        // Return the two combined with a slash.  In case either was blank,
        //  we need to "condition" them, so there are no leading/trailing slashes.
        return conditionPathPart(root + '/' + subFolder);
    }

    const createDocumentInFolderTool = tool(
        async (options: z.infer<typeof createDocumentInFolderSchema.schema>) => {
            // Create the document.
            const newTextDocument = <NewDbItem<TextDocumentData>>{
                name: options.fileName,
                type: 'text',
                content: options.content,
                comments: [],
                description: options.description,
                folderLocation: combineFolders(params.permissions.rootFolder, options.subFolder),
                projectId: params.projectId,
                lastChangedBy: { entityType: 'agent', id: params.agentId },
                createdDate: new Date(),
                updatedDate: new Date,
            };

            // Add it to the database.
            const dbDocument = await params.chatDocumentDbService.createDocument(newTextDocument);

            return `A new document with the id ${dbDocument._id.toString()} was created with the name of ${newTextDocument.name}.`;
        },
        createDocumentInFolderSchema
    );

    return createDocumentInFolderTool;
}

function createListDocumentTools(params: ManageDocumentFolderFunctionInfo) {
    const listDocumentsToolSchema = {
        name: `list_folder_documents_${params.pluginId.toString()}`,
        description: `Returns a list of documents for the folder ${params.permissions.rootFolder} with most information excluding their content.`,
        scheme: z.object({})
    };

    const listDocumentsTool = tool(
        async (options: z.infer<typeof listDocumentsToolSchema.scheme>) => {
            return params.chatDocumentDbService.getDocumentListItemsByFolderPrefix(params.projectId, params.permissions.rootFolder);
        },
        listDocumentsToolSchema
    );

    const getDocumentsByIdSchema = {
        name: `get_documents_by_id_${params.pluginId.toString()}`,
        description: `Returns a set of documents by their IDs in the folder: ${params.permissions.rootFolder}.`,
        schema: z.object({
            documentIds: z.array(z.string()).describe(`The string version of the document's ID.  The tool will convert these to actual ObjectIds for you.`)
        })
    };

    const getDocumentsByIdTool = tool(
        async (options: z.infer<typeof getDocumentsByIdSchema.schema>) => {
            const ids = options.documentIds.map(id => new ObjectId(id));
            return await params.chatDocumentDbService.getDocumentsByIds(ids);
        },
        getDocumentsByIdSchema
    );

    return [listDocumentsTool, getDocumentsByIdTool];
}

function createCreationAndListingTools(params: ManageDocumentFolderFunctionInfo) {
    if (params.permissions.canCreateSubfolders) {
        return [
            getCreateDocumentsAndFoldersTools(params),
        ];
    } else {
        return [
            getCreateRegularDocumentsTools(params),
        ];
    }
}
// ---------------------------

/** Returns the tools required to edit/modify document information. */
export function createTextDocumentTools(info: ManageDocumentFolderFunctionInfo) {
    const perms = info.permissions || {};
    const result: (ToolNode | StructuredToolInterface)[] = [
        ...createListDocumentTools(info)
    ];

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

    if (perms.canCreateFiles) {
        result.push(...createCreationAndListingTools(info));
    }

    return result;
}