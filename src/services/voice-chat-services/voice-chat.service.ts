import { ObjectId } from "mongodb";
import { VoiceFileReferenceDbService } from "../../database/chat-core/voice-file-reference-db.service";
import { VoiceFileReference } from '../../model/shared-models/chat-core/voice/voice-file-reference.model';
import { IVoiceParameters } from "../../model/shared-models/chat-core/voice/voice-parameters-base.model";
import { AwsS3BucketService } from "../aws-s3-bucket.service";
import { IVoiceChatProvider } from "./voice-chat-provider.interface";
import { IAppConfig } from "../../model/app-config.model";
import { ChatRoomDbService } from "../../database/chat-core/chat-room-db.service";
import { getMessageId, getMessageVoiceId, setMessageVoiceId } from "../../model/shared-models/chat-core/utils/messages.utils";
import { BaseMessage } from "@langchain/core/messages";

export class VoiceChatService {
    constructor(
        protected appConfig: IAppConfig,
        private voiceChatProviders: IVoiceChatProvider<any>[],
        private voiceFileReferenceDbService: VoiceFileReferenceDbService,
        private awsBucketService: AwsS3BucketService,
        private chatRoomDbService: ChatRoomDbService,
    ) {

    }

    /** Finds the IVoiceChatProvider that can provide voice for a specified message. */
    protected getChatProviderForMessage(messageParams: IVoiceParameters) {
        return this.voiceChatProviders.find(p => p.canHandleParameterType(messageParams.parameterType));
    }

    /** Returns the raw body of the voice MP3 file for a specified message. 
     *   This does no additional processing of the message. */
    async getVoiceMessageForMessageRaw(message: string, params: IVoiceParameters) {
        // Get the provider.
        const provider = this.getChatProviderForMessage(params);

        // Validate.
        if (!provider) {
            throw new Error(`No provider found for the parameter of type ${params.parameterType}`);
        }

        // Return the voice message.
        const result = await provider.getVoiceMessage(message, params);
        return result?.valueOf() as Buffer<ArrayBufferLike>;
    }

    /** Attempts to create, or get an existing, url for the voice chat message of a specified base message. */
    async getVoiceMessageForMessage(message: BaseMessage, params: IVoiceParameters, chatRoomId: ObjectId): Promise<string | undefined> {
        // Check if we already have a message, and return it if we do.
        const existingId = getMessageVoiceId(message);
        if (existingId) {
            // We already have one.  Try to get it.
            const item = await this.voiceFileReferenceDbService.getVoiceFileReferenceById(existingId);

            if (item) {
                // If it's not processed yet, we can't do anything - it's still being processed (at least we think it is).
                if (!item.isProcessed) {
                    return undefined;
                }

                // Try to get and return the URL.
                return this.awsBucketService.getDownloadUriForObject(item.awsBucketInfo);
            }
        }

        // We don't have one already.  Generate and return a new value.
        return this.createVoiceMessageForMessage(message, params, chatRoomId);
    }

    /** Generates a voice message, places it in an S3 bucket, and returns the URL to the MP3 message. */
    async createVoiceMessageForMessage(message: BaseMessage, params: IVoiceParameters, chatRoomId: ObjectId): Promise<string> {

        // Create the reference data.
        const storeDataId = new ObjectId();
        const storeData: VoiceFileReference = {
            _id: storeDataId,
            chatRoomId: chatRoomId,
            isProcessed: false,
            processingDateTime: new Date(),
            awsBucketInfo: {
                bucket: this.appConfig.voiceConfiguration.bucketName,
                key: storeDataId.toString(),
                contentType: 'audio/mpeg',
            },
        };

        // Store it for now.
        this.voiceFileReferenceDbService.upsertVoiceFileReference(storeData);

        // Get the file content.
        const content = await this.getVoiceMessageForMessageRaw(message.text, params);

        // If none, we have issue.
        if (!content) {
            throw new Error(`No voice message was provided.`);
        }

        // Store the message in S3 storage.
        await this.awsBucketService.storeObject(storeData.awsBucketInfo, content);

        // Set the ID of the voice file on the message itself.
        setMessageVoiceId(message, storeDataId);

        // Update the db store.
        storeData.isProcessed = true;
        await this.voiceFileReferenceDbService.updateVoiceFileReference(storeData._id, storeData);

        // Set it in the database - just in case it wasn't going to be done somewhere else.
        const messageId = getMessageId(message);
        if (!messageId) {
            throw new Error(`message does not have an ID, so cannot generate a voice chat message for it.`);
        }
        this.chatRoomDbService.setVoiceMessageOnConversationMessage(chatRoomId, messageId, storeDataId);

        // Return the file path to the file.
        return this.awsBucketService.getDownloadUriForObject(storeData.awsBucketInfo);
    }
}