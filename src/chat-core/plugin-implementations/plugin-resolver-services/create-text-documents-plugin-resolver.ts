import { IPluginTypeResolver } from "../../agent-plugin/i-plugin-type-resolver";
import { CreateTextDocumentsPlugin } from "../plugins/create-text-documents.plugin";
import { CREATE_TEXT_DOCUMENTS_PLUGIN_TYPE_ID } from "../../../model/shared-models/chat-core/plugins/plugin-type-constants.data";
import { PluginSpecification } from "../../../model/shared-models/chat-core/plugin-specification.model";
import { PluginInstanceReference } from "../../../model/shared-models/chat-core/plugin-instance-reference.model";
import { CreateTextDocumentsPluginParams } from "../../../model/shared-models/chat-core/plugins/create-text-documents-plugin.params";
import { PluginAttachmentTarget } from "../../agent-plugin/agent-plugin-base.service";
import { ChatDocumentDbService } from "../../../database/chat-core/chat-document-db.service";
import { isDocumentProvider } from "../../document/document-provider.interface";

export class CreateTextDocumentsPluginResolver implements IPluginTypeResolver<CreateTextDocumentsPlugin> {
    constructor(
        readonly documentsDbService: ChatDocumentDbService
    ) {

    }

    canImplementType(typeName: string): boolean {
        return typeName === CREATE_TEXT_DOCUMENTS_PLUGIN_TYPE_ID;
    }

    async createNewPlugin(specification: PluginSpecification<CreateTextDocumentsPluginParams>, attachedTo: PluginAttachmentTarget): Promise<CreateTextDocumentsPlugin> {
        // Only IDocumentProviders are allowed to be attached to.
        if (!isDocumentProvider(attachedTo)) {
            throw new Error('attachedTo must be an IDocumentProvider.');
        }

        const result = new CreateTextDocumentsPlugin(specification, this.documentsDbService);
        result.attachedTo = attachedTo;
        return result;
    }

    async hydratePlugin(pluginInstance: PluginInstanceReference<CreateTextDocumentsPluginParams>, attachedTo: PluginAttachmentTarget): Promise<CreateTextDocumentsPlugin> {
        // Only IDocumentProviders are allowed to be attached to.
        if (!isDocumentProvider(attachedTo)) {
            throw new Error('attachedTo must be an IDocumentProvider.');
        }

        const result = new CreateTextDocumentsPlugin(pluginInstance, this.documentsDbService);
        result.attachedTo = attachedTo;
        return result;
    }
}
