
export const HUME_VOICE_TYPE = 'hume';

export interface HumeVoiceParameters {
    parameterType: typeof HUME_VOICE_TYPE;
    voiceInstructions: string;
}