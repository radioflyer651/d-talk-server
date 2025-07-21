import { AgentPluginBase, PluginAttachmentTarget } from "../../agent-plugin/agent-plugin-base.service";
import { IChatLifetimeContributor } from "../../chat-lifetime-contributor.interface";
import { CREATE_TEXT_DOCUMENTS_PLUGIN_TYPE_ID } from "../../../model/shared-models/chat-core/plugins/plugin-type-constants.data";
import { PluginInstanceReference } from "../../../model/shared-models/chat-core/plugin-instance-reference.model";
import { PluginSpecification } from "../../../model/shared-models/chat-core/plugin-specification.model";
import { CreateTextDocumentsPluginParams } from "../../../model/shared-models/chat-core/plugins/create-text-documents-plugin.params";
import { z } from "zod";
import { StructuredToolInterface, tool } from "@langchain/core/tools";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ObjectId } from "mongodb";
import { ChatDocumentDbService } from "../../../database/chat-core/chat-document-db.service";
import { TextDocumentData } from "../../../model/shared-models/chat-core/documents/document-types/text-document.model";
import { NewDbItem } from "../../../model/shared-models/db-operation-types.model";
import { Agent } from "../../agent/agent.service";
import { IDocumentProvider, isDocumentProvider } from "../../document/document-provider.interface";
import { ChatDocumentReference } from "../../../model/shared-models/chat-core/documents/chat-document-reference.model";

export class CreateTextDocumentsPlugin extends AgentPluginBase implements IChatLifetimeContributor {
    constructor(
        params: PluginInstanceReference<CreateTextDocumentsPluginParams> | PluginSpecification<CreateTextDocumentsPluginParams>,
        readonly documentsDbService: ChatDocumentDbService,
    ) {
        super(params);
    }

    agentUserManual?: string | undefined;
    readonly type = CREATE_TEXT_DOCUMENTS_PLUGIN_TYPE_ID;

    async getTools(): Promise<(ToolNode | StructuredToolInterface)[]> {
        // Only IDocumentProviders are allowed to be attached to.
        if (!isDocumentProvider(this.attachedTo)) {
            throw new Error('attachedTo must be an IDocumentProvider.');
        }

        console.log(`Getting tools (Create Text Document Plugin)`, this.specification?.configuration, this.specification!.id, this.agent, this.chatRoom.project._id);
        return createTools(this.specification!.configuration, this.specification!.id, this.agent, this.attachedTo! as IDocumentProvider, this.chatRoom.project._id, this.documentsDbService);
    }
}


function getCommonInstructions(params: CreateTextDocumentsPluginParams): string {
    return `
    Creates a new text document, which may be ANY form of text file (HTML, plain text, JSON, etc) in the folder ${params.rootFolder}. 
    After the document is created, you can edit the document through another tool call.
    When creating new document, be sure to include detailed descriptions, indicating what the content of the document is for, and when to edit it.
    Do not attempt to provide links to new documents.  They won't work.
    Keep document names short, and use spaces.  These are not file names.
    Folder path formats are 'folder1/folder2/folder3'.
    ${params.instructions}
    `;
}

function getCreateRegularDocumentsTools(params: CreateTextDocumentsPluginParams, pluginId: ObjectId, agent: Agent, documentProvider: IDocumentProvider, projectId: ObjectId, documentsDbService: ChatDocumentDbService) {

    const createDocumentSchema = {
        name: `create_text_document_${pluginId.toString()}`,
        describe: getCommonInstructions(params),
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
                folderLocation: params.rootFolder,
                projectId: projectId,
                lastChangedBy: { entityType: 'agent', id: agent.identity._id },
                createdDate: new Date(),
                updatedDate: new Date,
            };

            // Add it to the database.
            const dbDocument = await documentsDbService.createDocument(newTextDocument);

            // Add the reference to the document, to the owner.
            documentProvider.addDocumentReference(<ChatDocumentReference[]>[
                {
                    documentId: dbDocument._id,
                    folderPath: dbDocument.folderLocation,
                    permission: {
                        canChangeName: true,
                        canEdit: true,
                        canRead: true,
                        canUpdateComments: true,
                        canUpdateDescription: true,
                    }
                }
            ]);
        },
        createDocumentSchema
    );

    return createDocumentTool;
}

function getCreateDocumentsAndFoldersTools(params: CreateTextDocumentsPluginParams, pluginId: ObjectId, agent: Agent, documentProvider: IDocumentProvider, projectId: ObjectId, documentsDbService: ChatDocumentDbService) {
    const createDocumentInFolderSchema = {
        name: `create_text_document_${pluginId.toString()}`,
        describe: getCommonInstructions(params),
        schema: z.object({
            fileName: z.string().describe(`The name of the file you're creating.`),
            subFolder: z.string().describe(`The sub folder of ${params.rootFolder}, IF ANY, to add the document to.  If placing it in the current root, then leave this an empty string.`),
            description: z.string().describe(`This is a description of what this file is, and what it's for.  If the description also has instructions, those instructions are provided to any LLM agent using the file as a system message as well.`),
            content: z.string().describe(`The content of the document.`),
        })
    };

    function combineFolders(root: string, subFolder: string): string {
        // Ensures there are no leading/trailing slashes or whitespace.
        function conditionPathPart(val: string) {
            val = val.trim();

            if (val.endsWith('/')) {
                val = val.substring(0, val.length - 2);
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
                folderLocation: combineFolders(params.rootFolder, options.subFolder),
                projectId: projectId,
                lastChangedBy: { entityType: 'agent', id: agent.identity._id },
                createdDate: new Date(),
                updatedDate: new Date,
            };

            // Add it to the database.
            const dbDocument = await documentsDbService.createDocument(newTextDocument);

            // Add the reference to the document, to the owner.
            documentProvider.addDocumentReference(<ChatDocumentReference[]>[
                {
                    documentId: dbDocument._id,
                    folderPath: dbDocument.folderLocation,
                    permission: {
                        canChangeName: true,
                        canEdit: true,
                        canRead: true,
                        canUpdateComments: true,
                        canUpdateDescription: true,
                    }
                }
            ]);
        },
        createDocumentInFolderSchema
    );

    return createDocumentInFolderTool;
}

function createListDocumentTools(params: CreateTextDocumentsPluginParams, pluginId: ObjectId, projectId: ObjectId, documentsDbService: ChatDocumentDbService) {
    const listDocumentsToolSchema = {
        name: `list_folder_documents_${pluginId.toString()}`,
        describe: `Returns a list of documents for the folder ${params.rootFolder} with most information excluding their content.`,
        scheme: z.object({})
    };

    const listDocumentsTool = tool(
        async (options: z.infer<typeof listDocumentsToolSchema.scheme>) => {
            return documentsDbService.getDocumentListItemsByFolderPrefix(projectId, params.rootFolder);
        },
        listDocumentsToolSchema
    );

    const getDocumentsByIdSchema = {
        name: `get_documents_by_id_${pluginId.toString()}`,
        describe: `Returns a set of documents by their IDs.`,
        schema: z.object({
            documentIds: z.array(z.string()).describe(`The string version of the document's ID.  The tool will convert these to actual ObjectIds for you.`)
        })
    };

    const getDocumentsByIdTool = tool(
        async (options: z.infer<typeof getDocumentsByIdSchema.schema>) => {
            const ids = options.documentIds.map(id => new ObjectId(id));
            return await documentsDbService.getDocumentsByIds(ids);
        },
        getDocumentsByIdSchema
    );

    return [listDocumentsTool, getDocumentsByIdTool];
}

function createTools(params: CreateTextDocumentsPluginParams, pluginId: ObjectId, agent: Agent, documentProvider: IDocumentProvider, projectId: ObjectId, documentsDbService: ChatDocumentDbService) {
    if (!pluginId) {
        throw new Error(`pluginId cannot be unset.`);
    }

    if (params.canCreateSubfolders) {
        return [
            getCreateDocumentsAndFoldersTools(params, pluginId, agent, documentProvider, projectId, documentsDbService),
            ...createListDocumentTools(params, pluginId, projectId, documentsDbService)
        ];
    } else {
        return [
            getCreateRegularDocumentsTools(params, pluginId, agent, documentProvider, projectId, documentsDbService),
            ...createListDocumentTools(params, pluginId, projectId, documentsDbService)
        ];
    }
}

