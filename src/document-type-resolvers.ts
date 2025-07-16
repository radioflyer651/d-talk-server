import { IDocumentResolver } from "./chat-core/document/document-resolver.interface";
import { TextDocumentResolver } from "./chat-core/document/resolvers/text-document.resolver";
import { IAppConfig } from "./model/app-config.model";
import { textDocumentSocketServer } from "./setup-socket-services";


export let documentTypeResolvers: IDocumentResolver[];
export let textDocumentResolver: TextDocumentResolver;

export async function initializeDocumentTypeResolvers(config: IAppConfig) {
    // This is wrong.  The text document resolver should not have to be its own variable.
    textDocumentResolver = new TextDocumentResolver(textDocumentSocketServer);

    documentTypeResolvers = [
        textDocumentResolver,
    ];
}