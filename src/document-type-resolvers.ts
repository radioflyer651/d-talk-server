import { IDocumentResolver } from "./chat-core/document/document-resolver.interface";
import { TextDocumentResolver } from "./chat-core/document/resolvers/text-document.resolver";
import { IAppConfig } from "./model/app-config.model";


export let documentTypeResolvers: IDocumentResolver[];

export async function initializeDocumentTypeResolvers(config: IAppConfig) {
    documentTypeResolvers = [
        new TextDocumentResolver()
    ];
}