import { IAppConfig } from '../../model/app-config.model';
import { OpenAiServiceBase } from "../apen-ai-base.service";
import { IVoiceChatProvider } from "./voice-chat-provider.interface";
import { OPEN_AI_VOICE_TYPE, OpenAiVoiceParameters } from "../../model/shared-models/chat-core/voice/open-ai-voice-parameters.model";
import { AwsStoreTypes } from '../../model/shared-models/storeable-types.model';


/** Provides services for serving Audio files, which are LLM responses converted to audio. */
export class OpenAiVoiceChatService extends OpenAiServiceBase implements IVoiceChatProvider<OpenAiVoiceParameters> {
    constructor(
        private config: IAppConfig,
    ) {
        super(config);

        if (!this.config) {
            throw new Error('config must have a value.');
        }
    }

    canHandleParameterType(typeName: string): boolean {
        return typeName === OPEN_AI_VOICE_TYPE;
    }

    /** Gets a voice implementation of a specified text string, and returns it. */
    async createAudioForMessage(message: string, voiceInstructions: string, speed: number | undefined, voice: string, actingInstructions?: string) {
        // Create the audio.
        const result = await this.openAi.audio.speech.create({
            model: 'gpt-4o-mini-tts',
            instructions: voiceInstructions,
            input: message,
            voice: voice,
            speed: speed,
            response_format: "mp3"
        });

        // Return the result.
        return result;
    }

    async getVoiceMessage(message: string, configuration: OpenAiVoiceParameters, actingInstructions?: string): Promise<AwsStoreTypes | undefined> {
        const result = await this.createAudioForMessage(message, actingInstructions ?? '', configuration.speed, configuration.voice);
        return result.blob();
    }
}