import { IVoiceParameters } from "./voice-parameters-base.model";

export const OPEN_AI_VOICE_TYPE = 'open-ai';
export interface OpenAiVoiceParameters extends IVoiceParameters {
    parameterType: typeof OPEN_AI_VOICE_TYPE;
    voice: string;
    speed: number;
}

export function getDefaultOpenaiVoiceParameters(): OpenAiVoiceParameters {
    return {
        parameterType: OPEN_AI_VOICE_TYPE,
        speed: 1,
        voice: 'coral'
    };
}