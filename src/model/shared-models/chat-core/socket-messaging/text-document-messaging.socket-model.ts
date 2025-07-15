import { ObjectId } from "mongodb";

export const ENTER_TEXT_DOCUMENT_ROOM = 'entered-text-document-room';
export const EXIT_TEXT_DOCUMENT_ROOM = 'exited-text-document-room';
export const TEXT_DOCUMENT_CONTENT_CHANGE = 'text-document-content-change';

export interface EnterTextDocumentRoomMessage {
    documentId: ObjectId;
}

export interface ExitTextDocumentRoomMessage {
    documentId: ObjectId;
}

export interface TextDocumentContentChangeMessage {
    documentId: ObjectId;
    newContent: string;
}

/** Returns the SocketIO room name for a ChatRoom, specified by its ID. */
export function getTextDocumentRoomName(textDocumentId: ObjectId) {
    return `text-document-room-${textDocumentId.toString()}`;
}