import { HumeClient } from "hume";
import { IAppConfig } from "../../model/app-config.model";
import { HUME_VOICE_TYPE, HumeVoiceParameters } from "../../model/shared-models/chat-core/voice/hume-voice-parameters.model";
import { IVoiceChatProvider } from "./voice-chat-provider.interface";
import { AwsStoreTypes } from "../../model/shared-models/storeable-types.model";
import { ReturnVoice } from "hume/api/resources/tts";

export type HumeVoiceTypes = 'HUME_AI' | 'CUSTOM_VOICE';

export class HumeVoiceChatService implements IVoiceChatProvider<HumeVoiceParameters> {
    constructor(private appConfig: IAppConfig) {
        this.humeClient = new HumeClient({
            apiKey: this.appConfig.humeCredentials.apiKey,
            secretKey: this.appConfig.humeCredentials.secretKey,
        });
    }

    private humeClient: HumeClient;

    canHandleParameterType(typeName: string): boolean {
        return typeName === HUME_VOICE_TYPE;
    }

    async getVoiceMessage(message: string, configuration: HumeVoiceParameters): Promise<AwsStoreTypes | undefined> {
        const nodeStream = await this.humeClient.tts.synthesizeFile({
            format: { type: 'mp3' },
            utterances: [
                {
                    text: message,
                    description: configuration.voiceInstructions
                }
            ],
        });

        return nodeStream;
    }

    /** Lists the voice names in Hume. */
    async listVoices(voiceType: HumeVoiceTypes): Promise<ReturnVoice[]> {
        return (await this.humeClient.tts.voices.list({ provider: voiceType })).data;
    }
}