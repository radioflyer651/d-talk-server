
/** Information about a specific available voice in OpenAI. */
export interface OpenAiVoice {
    name: string;
    gender: 'male' | 'female';
}

/** A set of voice choices for OpenAI voice generation. */
export const openAiVoices: OpenAiVoice[] = [
    { name: 'alloy', gender: 'male' },
    { name: 'ash', gender: 'male' },
    { name: 'coral', gender: 'female' },
    { name: 'echo', gender: 'male' },
    { name: 'fable', gender: 'female' },
    { name: 'onyx', gender: 'male' },
    { name: 'nova', gender: 'female' },
    { name: 'sage', gender: 'female' },
    { name: 'shimmer', gender: 'female' }
];

