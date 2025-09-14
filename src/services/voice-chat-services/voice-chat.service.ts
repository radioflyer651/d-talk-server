import { ObjectId } from "mongodb";
import { VoiceFileReferenceDbService } from "../../database/chat-core/voice-file-reference-db.service";
import { VoiceFileReference } from '../../model/shared-models/chat-core/voice/voice-file-reference.model';
import { IVoiceParameters } from "../../model/shared-models/chat-core/voice/voice-parameters-base.model";
import { AwsS3BucketService } from "../aws-s3-bucket.service";
import { IVoiceChatProvider } from "./voice-chat-provider.interface";
import { IAppConfig } from "../../model/app-config.model";
import { ChatRoomDbService } from "../../database/chat-core/chat-room-db.service";
import { getMessageId, getMessageVoiceId, getSpeakerFromMessage, setMessageVoiceId } from "../../model/shared-models/chat-core/utils/messages.utils";
import { BaseMessage, mapStoredMessageToChatMessage, StoredMessage } from "@langchain/core/messages";
import { AgentInstanceDbService } from "../../database/chat-core/agent-instance-db.service";
import { AgentDbService } from "../../database/chat-core/agent-db.service";
import { ChatRoomSocketServer } from "../../server/socket-services/chat-room.socket-service";

export class VoiceChatService {
    constructor(
        protected appConfig: IAppConfig,
        private voiceChatProviders: IVoiceChatProvider<any>[],
        private voiceFileReferenceDbService: VoiceFileReferenceDbService,
        private awsBucketService: AwsS3BucketService,
        private chatRoomDbService: ChatRoomDbService,
        private agentDbService: AgentDbService,
        private agentInstanceDbService: AgentInstanceDbService,
        private chatRoomSocketServer: ChatRoomSocketServer,
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
        return this.createVoiceMessageForMessageParams(message, params, chatRoomId);
    }

    /** Generates a voice message, places it in an S3 bucket, and returns the URL to the MP3 message. */
    async createVoiceMessageForMessageParams(message: BaseMessage, params: IVoiceParameters, chatRoomId: ObjectId): Promise<string> {
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

    /** Sends a voice message notification to the chat room through sockets. */
    protected notifyRoomOfVoiceMessage(chatRoomId: ObjectId, message: BaseMessage | StoredMessage) {
        this.chatRoomSocketServer.sendUpdateMessageToRoom(chatRoomId, message);
    }

    /** Generates a voice message for a specified message ID and chat room ID. */
    async createVoiceMessageForMessage(messageId: string, chatRoomId: ObjectId): Promise<string> {
        // Get the chat room.
        const chatRoom = await this.chatRoomDbService.getChatRoomById(chatRoomId);
        if (!chatRoom) {
            throw new Error(`Chat room with ID ${chatRoomId} does not exist.`);
        }

        // Find the message.
        const message = chatRoom.conversation.find(m => getMessageId(m) === messageId);
        if (!message) {
            throw new Error(`Message with ID ${messageId} does not exist in chat room ${chatRoomId}.`);
        }

        // Check if we already have the voice message.
        const existingVoiceId = getMessageVoiceId(message);
        if (existingVoiceId) {
            // We already have one.  Try to get it.
            const item = await this.voiceFileReferenceDbService.getVoiceFileReferenceById(existingVoiceId);
            if (item) {
                // The room is probably not aware, so let's tell it about the message first.
                this.notifyRoomOfVoiceMessage(chatRoomId, message);
                return this.awsBucketService.getDownloadUriForObject(item.awsBucketInfo);
            }
        }

        // Get the speaker/agent - we must have this to determine the voice.
        const speaker = getSpeakerFromMessage(message);
        if (!speaker || speaker.speakerType !== 'agent' || !speaker.speakerId) {
            throw new Error(`Message with ID ${messageId} does not have a speaker (agent), so cannot determine voice parameters.`);
        }

        // Get the agent for the speaker.
        const agentInstance = await this.agentInstanceDbService.getAgentById(new ObjectId(speaker.speakerId));
        if (!agentInstance) {
            throw new Error(`Agent with ID ${speaker.speakerId} does not exist, so cannot determine voice parameters.`);
        }

        // Get the agent configuration for the agent instance.
        const agent = await this.agentDbService.getAgentIdentityById(new ObjectId(agentInstance.identity));
        if (!agent) {
            throw new Error(`Agent configuration with ID ${agentInstance.identity} does not exist, so cannot determine voice parameters.`);
        }

        // Get the voice parameters for the agent.
        const voiceParams = agent.voiceMessageParams;
        if (!voiceParams) {
            throw new Error(`Agent with ID ${speaker.speakerId} does not have voice parameters, so cannot create a voice message.`);
        }

        // Hydrate the message.
        const baseMessage = mapStoredMessageToChatMessage(message);

        // Create the voice message.
        return this.createVoiceMessageForMessageParams(baseMessage, voiceParams, chatRoomId);
    }
}