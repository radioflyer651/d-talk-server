import { ChatDocumentDbService } from "../../../database/chat-core/chat-document-db.service";
import { IChatDocumentCreationParams, IChatDocumentData } from "../../../model/shared-models/chat-core/documents/chat-document.model";
import { TEXT_DOCUMENT_TYPE } from "../../../model/shared-models/chat-core/documents/document-type.constants";
import { TextDocumentData } from "../../../model/shared-models/chat-core/documents/document-types/text-document.model";
import { NewDbItem } from "../../../model/shared-models/db-operation-types.model";
import { IDocumentResolver } from "../document-resolver.interface";
import { TextDocument } from "../documents/text-document/text-document.service";


export class TextDocumentResolver implements IDocumentResolver<TextDocument, TextDocumentData> {
    canResolveType(documentType: string): boolean {
        return documentType === TEXT_DOCUMENT_TYPE;
    }

    async createNewDocumentData(configuration: IChatDocumentCreationParams): Promise<NewDbItem<TextDocumentData>> {
        const data: NewDbItem<TextDocumentData> = {
            ...configuration,
            content: '',
            type: TEXT_DOCUMENT_TYPE,
            comments: [],
            updatedDate: new Date(),
            createdDate: new Date(),
            description: '',
        };

        return data;
    }

    async createNewDocument(document: TextDocumentData, documentDbService: ChatDocumentDbService): Promise<TextDocument> {
        return await this.hydrateDocument(document, documentDbService);
    }

    async hydrateDocument(document: TextDocumentData, documentDbService: ChatDocumentDbService): Promise<TextDocument> {
        return new TextDocument(document, documentDbService);
    }

}