import { AgentPluginBase } from "../../agent-plugin/agent-plugin-base.service";
import { IChatLifetimeContributor } from "../../chat-lifetime-contributor.interface";
import { MANAGE_DOCUMENT_FOLDER_PLUGIN_TYPE_ID } from "../../../model/shared-models/chat-core/plugins/plugin-type-constants.data";
import { PluginInstanceReference } from "../../../model/shared-models/chat-core/plugin-instance-reference.model";
import { PluginSpecification } from "../../../model/shared-models/chat-core/plugin-specification.model";
import { ChatDocumentDbService } from "../../../database/chat-core/chat-document-db.service";
import { ChatDirectoryPermissions } from "../../../model/shared-models/chat-core/documents/chat-document-permissions.model";
import { createTextDocumentTools, ManageDocumentFolderFunctionInfo } from "../../document/documents/text-document/text-document-directory-edit.tools";
import { StructuredToolInterface } from "@langchain/core/tools";
import { ToolNode } from "@langchain/langgraph/prebuilt";

export class ManageDocumentFolderPlugin extends AgentPluginBase implements IChatLifetimeContributor {
    constructor(
        params: PluginInstanceReference<ChatDirectoryPermissions> | PluginSpecification<ChatDirectoryPermissions>,
        readonly chatDocumentDbService: ChatDocumentDbService,
    ) {
        super(params);
    }

    get agentUserManual(): string {
        const permissions = this.specification!.configuration;

        return `You have been given the ability to work with the folder "${permissions.rootFolder}, and the files within it.
            You can list the directory and read the contents within files of it.
            Tools suffixed with ${this.specification!.id.toString()} are used to work with this folder.
            You have the following permissions:
            Can Edit File Contents: ${!!permissions.canEdit}
            Edit File Descriptions Fields: ${!!permissions.canUpdateDescription}
            Change File Names: ${!!permissions.canChangeName}
            Update File Comments: ${!!permissions.canUpdateComments}
            Create Sub Folders: ${!!permissions.canCreateSubfolders}
            Create New Files: ${!!permissions.canCreateFiles}
            `.trim().replaceAll(/ +/g, ' ').replaceAll(/\t/g, '');
    }

    declare specification?: PluginSpecification<ChatDirectoryPermissions>;

    readonly type = MANAGE_DOCUMENT_FOLDER_PLUGIN_TYPE_ID;

    async getTools(): Promise<(ToolNode | StructuredToolInterface)[]> {
        // Permissions and other context should come from the plugin params/configuration
        const config = this.specification!.configuration as ChatDirectoryPermissions;
        const info = <ManageDocumentFolderFunctionInfo>{
            pluginId: this.specification!.id,
            chatDocumentDbService: this.chatDocumentDbService,
            agentId: this.agent.identity._id,
            projectId: this.chatRoom.project._id,
            permissions: config,
            onContentChanged: async () => { },
        };
        return createTextDocumentTools(info);
    }
}
