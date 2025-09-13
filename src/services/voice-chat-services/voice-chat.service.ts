import { ObjectId } from "mongodb";
import { VoiceFileReferenceDbService } from "../../database/chat-core/voice-file-reference-db.service";
import { VoiceFileReference } from '../../model/shared-models/chat-core/voice/voice-file-reference.model';
import { IVoiceParameters } from "../../model/shared-models/chat-core/voice/voice-parameters-base.model";
import { AwsS3BucketService } from "../aws-s3-bucket.service";
import { IVoiceChatProvider } from "./voice-chat-provider.interface";
import { IAppConfig } from "../../model/app-config.model";
import { AgentInstanceConfiguration } from "../../model/shared-models/chat-core/agent-instance-configuration.model";


export class VoiceChatService {
    constructor(
        protected appConfig: IAppConfig,
        private voiceChatProviders: IVoiceChatProvider<any>[],
        private voiceFileDbService: VoiceFileReferenceDbService,
        private bucketDbService: VoiceFileReferenceDbService,
        private awsBucketService: AwsS3BucketService,
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

    /** Generates a voice message, places it in an S3 bucket, and returns the URL to the MP3 message. */
    async getVoiceMessageForMessage(message: string, params: IVoiceParameters, chatRoomId: ObjectId): Promise<string> {

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
        this.bucketDbService.upsertVoiceFileReference(storeData);

        // Get the file content.
        const content = await this.getVoiceMessageForMessageRaw(message, params);

        // If none, we have issue.
        if (!content) {
            throw new Error(`No voice message was provided.`);
        }

        // Store the message in S3 storage.
        await this.awsBucketService.storeObject(storeData.awsBucketInfo, content);

        // Update the db store.
        storeData.isProcessed = true;
        await this.bucketDbService.updateVoiceFileReference(storeData._id, storeData);

        // Return the file path to the file.
        return this.awsBucketService.getDownloadUriForObject(storeData.awsBucketInfo);
    }
}