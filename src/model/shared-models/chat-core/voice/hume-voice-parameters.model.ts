import { ReturnVoice, VoiceProvider } from "hume/api/resources/tts";

export const HUME_VOICE_TYPE = 'hume';

export interface HumeVoiceParameters {
    parameterType: typeof HUME_VOICE_TYPE;
    voiceProvider: VoiceProvider;
    voice: ReturnVoice;
}

export function getDefaultHumeVoiceParameters(): HumeVoiceParameters {
    return {
        parameterType: HUME_VOICE_TYPE,
        voiceProvider: 'CUSTOM_VOICE',
        voice: {
            name: 'Ash2',
            id: '600e8e61-4a31-4624-929a-50cc4b77e6e6',
            provider: "CUSTOM_VOICE"
        }
    };
}