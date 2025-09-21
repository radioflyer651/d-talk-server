import { HumeClient } from "hume";
import { IAppConfig } from "../../model/app-config.model";
import { HUME_VOICE_TYPE, HumeVoiceParameters } from "../../model/shared-models/chat-core/voice/hume-voice-parameters.model";
import { IVoiceChatProvider } from "./voice-chat-provider.interface";
import { AwsStoreTypes } from "../../model/shared-models/storeable-types.model";
import { PostedUtterance, ReturnVoice } from "hume/api/resources/tts";

export type HumeVoiceTypes = 'HUME_AI' | 'CUSTOM_VOICE';

export class HumeVoiceChatService implements IVoiceChatProvider<HumeVoiceParameters> {
    constructor(
        private appConfig: IAppConfig,
    ) {
        this.humeClient = new HumeClient({
            apiKey: this.appConfig.humeCredentials.apiKey,
            secretKey: this.appConfig.humeCredentials.secretKey,
        });
    }

    private humeClient: HumeClient;

    canHandleParameterType(typeName: string): boolean {
        return typeName === HUME_VOICE_TYPE;
    }

    async getVoiceMessage(message: string, configuration: HumeVoiceParameters, actingInstructions?: string): Promise<AwsStoreTypes | undefined> {
        const voice = configuration.voice;

        const utterance: PostedUtterance = {
            text: message,
            voice: { id: voice.id!, provider: voice.provider! },
            description: actingInstructions,
        };
        if (typeof configuration.speed === 'number') {
            utterance.speed = configuration.speed;
        }

        const nodeStream = await this.humeClient.tts.synthesizeFile({
            format: { type: 'mp3' },
            utterances: [utterance],
        });

        const chunks: Buffer[] = [];
        for await (const chunk of nodeStream) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }

        return Buffer.concat(chunks);
    }

    /** Lists the voice names in Hume. */
    async listVoices(voiceType: HumeVoiceTypes): Promise<ReturnVoice[]> {
        const result = [] as ReturnVoice[];
        let response = await this.humeClient.tts.voices.list({ provider: voiceType, pageSize: 100 });
        let isFirstPage = true;

        do {
            if (!isFirstPage) {
                response = await response.getNextPage();
            }
            isFirstPage = false;

            for await (const item of response) {
                result.push(item);
            }
        } while (response.hasNextPage());

        return result;
        //return (await this.humeClient.tts.voices.list({ provider: voiceType, ascendingOrder: true, pageSize: 100 })).data;
    }
}