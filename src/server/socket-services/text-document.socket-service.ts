import { ObjectId } from "mongodb";
import { ENTER_TEXT_DOCUMENT_ROOM, EnterTextDocumentRoomMessage, EXIT_TEXT_DOCUMENT_ROOM, ExitTextDocumentRoomMessage, getTextDocumentRoomName, TEXT_DOCUMENT_CONTENT_CHANGE, TextDocumentContentChangeMessage } from "../../model/shared-models/chat-core/socket-messaging/text-document-messaging.socket-model";
import { SocketServer } from "../socket.server";
import { SocketServiceBase } from "./socket-server-base.socket-service";
import { TextDocumentData } from "../../model/shared-models/chat-core/documents/document-types/text-document.model";
import { ChatDocumentDbService } from "../../database/chat-core/chat-document-db.service";
import { ProjectDbService } from "../../database/chat-core/project-db.service";
import { userHasAccessToDocument } from "../../utils/user-access.utils";
import { from, switchMap } from "rxjs";
import { TEXT_DOCUMENT_TYPE } from "../../model/shared-models/chat-core/documents/document-type.constants";
import { TextDocument } from "../../chat-core/document/documents/text-document/text-document.service";


export class TextDocumentSocketService extends SocketServiceBase {
    constructor(
        socketServer: SocketServer,
        readonly documentDbService: ChatDocumentDbService,
        readonly projectDbService: ProjectDbService,
    ) {
        super(socketServer);
    }

    async initialize(): Promise<void> {
        this.socketServer.subscribeToEvent(ENTER_TEXT_DOCUMENT_ROOM).subscribe((ev) => {
            const args = ev.data[0] as EnterTextDocumentRoomMessage;
            this.socketServer.joinRoom(ev.socket, getTextDocumentRoomName(args.documentId));
        });

        this.socketServer.subscribeToEvent(EXIT_TEXT_DOCUMENT_ROOM).subscribe((ev) => {
            const args = ev.data[0] as ExitTextDocumentRoomMessage;
            this.socketServer.leaveRoom(ev.socket, getTextDocumentRoomName(args.documentId));
        });

        this.socketServer.subscribeToEvent(TEXT_DOCUMENT_CONTENT_CHANGE)
            .pipe(
                switchMap(ev => {
                    // Note: from converts a PROMISE, not a FUNCTION that returns a PROMISE.
                    //  Therefore, we must actually call the function here.  (easy to miss!)
                    return from((async () => {
                        // Get the arguments.
                        const args = ev.data[0] as TextDocumentContentChangeMessage;

                        // Ensure the user has access to this.
                        const userId = ev.userId;
                        if (!userId) {
                            throw new Error(`User credentials not received.`);
                        }

                        const document = await this.documentDbService.getDocumentById(args.documentId);
                        if (!document) {
                            throw new Error(`Document with ID ${args.documentId.toString()} does not exist.`);
                        }

                        const access = await userHasAccessToDocument(userId, document);
                        if (!access) {
                            throw new Error(`User does not have access to the document.`);
                        }
                        if (document.type !== TEXT_DOCUMENT_TYPE) {
                            throw new Error(`Document not a text document.`);
                        }
                        const textDocument = document as TextDocumentData;

                        await this.documentDbService.updateDocument(document._id, {
                            //@ts-ignore We know that this derived document type has content.
                            content: textDocument.content
                        });

                        return { event: ev, document: textDocument };
                    })());
                })
            )
            .subscribe((ev) => {
                const { event, document } = ev;

                // Inform subscribers of the update.
                this.socketServer.emitEventToRoomExceptTo(TEXT_DOCUMENT_CONTENT_CHANGE, getTextDocumentRoomName(document._id), ev.event.socket, event.eventName, ...event.data);
            });
    }

    /** Sends updates about text document content to the front end. */
    async sendChangeToDocument(documentId: ObjectId, textDocument: TextDocumentData): Promise<void> {
        // Inform subscribers of the update.
        this.socketServer.emitEventToRoom(TEXT_DOCUMENT_CONTENT_CHANGE, getTextDocumentRoomName(documentId), textDocument.content);
    }

    /** Hooks up event handlers to a specified text document. */
    registerTextDocument(document: TextDocument): void {
        document.contentChanged$.subscribe(document => {
            // Emit the change to clients.
            this.sendChangeToDocument(document.data._id, document.data);
        });
    }
}