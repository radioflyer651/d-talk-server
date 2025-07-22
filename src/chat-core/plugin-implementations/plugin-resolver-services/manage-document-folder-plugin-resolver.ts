import { IPluginTypeResolver } from "../../agent-plugin/i-plugin-type-resolver";
import { ManageDocumentFolderPlugin } from "../plugins/manage-document-folder.plugin";
import { MANAGE_DOCUMENT_FOLDER_PLUGIN_TYPE_ID } from "../../../model/shared-models/chat-core/plugins/plugin-type-constants.data";
import { PluginSpecification } from "../../../model/shared-models/chat-core/plugin-specification.model";
import { PluginInstanceReference } from "../../../model/shared-models/chat-core/plugin-instance-reference.model";
import { PluginAttachmentTarget } from "../../agent-plugin/agent-plugin-base.service";
import { ChatDocumentDbService } from "../../../database/chat-core/chat-document-db.service";
import { isDocumentProvider } from "../../document/document-provider.interface";

export class ManageDocumentFolderPluginResolver implements IPluginTypeResolver<ManageDocumentFolderPlugin> {
    constructor(
        readonly chatDocumentDbService: ChatDocumentDbService,
    ) { }

    canImplementType(typeName: string): boolean {
        return typeName === MANAGE_DOCUMENT_FOLDER_PLUGIN_TYPE_ID;
    }

    async createNewPlugin(specification: PluginSpecification<any>, attachedTo: PluginAttachmentTarget): Promise<ManageDocumentFolderPlugin> {
        if (!isDocumentProvider(attachedTo)) {
            throw new Error('attachedTo must be an IDocumentProvider.');
        }
        const result = new ManageDocumentFolderPlugin(specification, this.chatDocumentDbService);
        result.attachedTo = attachedTo;
        return result;
    }

    async hydratePlugin(pluginInstance: PluginInstanceReference<any>, attachedTo: PluginAttachmentTarget): Promise<ManageDocumentFolderPlugin> {
        if (!isDocumentProvider(attachedTo)) {
            throw new Error('attachedTo must be an IDocumentProvider.');
        }
        const result = new ManageDocumentFolderPlugin(pluginInstance, this.chatDocumentDbService);
        result.attachedTo = attachedTo;
        return result;
    }
}
