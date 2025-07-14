import { ObjectId } from "mongodb";
import { UpdateInfo } from "../../model/shared-models/chat-core/update-info.model";
import { IChatDocumentData } from "../../model/shared-models/chat-core/documents/chat-document.model";


export abstract class ChatDocument {
    constructor(
        readonly data: IChatDocumentData,
    ) {

    }
}

