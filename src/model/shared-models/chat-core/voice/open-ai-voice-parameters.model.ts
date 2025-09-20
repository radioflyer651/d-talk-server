

export const OPEN_AI_VOICE_TYPE = 'open-ai';
export interface OpenAiVoiceParameters {
    parameterType: typeof OPEN_AI_VOICE_TYPE;
    instructions: string;
    voice: string;
    speed: number;
}

export function getDefaultOpenaiVoiceParameters(): OpenAiVoiceParameters {
    return {
        parameterType: OPEN_AI_VOICE_TYPE,
        instructions: '',
        speed: 1,
        voice: 'coral'
    };
}