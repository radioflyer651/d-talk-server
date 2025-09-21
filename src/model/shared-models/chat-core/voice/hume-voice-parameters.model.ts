import { ReturnVoice, VoiceProvider } from "hume/api/resources/tts";
import { IVoiceParameters } from "./voice-parameters-base.model";

export const HUME_VOICE_TYPE = 'hume';

export interface HumeVoiceParameters extends IVoiceParameters {
    parameterType: typeof HUME_VOICE_TYPE;
    voiceProvider: VoiceProvider;
    voice: ReturnVoice;
    /** The speed 1 to 10, for how fast the voice will talk. */
    speed?: number;
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