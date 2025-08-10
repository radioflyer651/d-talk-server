import { ModelServiceParams } from "../../model-service-params.model";
import { GptModelInfo, IGptModelData } from "./gpt-model-info.model";

export interface OpenAiModelParams extends ModelServiceParams<OpenAiModelServiceParams> {
    llmService: 'open-ai';
}

export interface OpenAiModelServiceParams {
    model: string;
    /** Sampling temperature to use */
    temperature?: number;
    /**
   * Whether to return log probabilities of the output tokens or not.
   * If true, returns the log probabilities of each output token returned in the content of message.
   */
    logprobs?: boolean;
    /**
     * An integer between 0 and 5 specifying the number of most likely tokens to return at each token position,
     * each with an associated log probability. logprobs must be set to true if this parameter is used.
     */
    topLogprobs?: number;
    /**
     * Maximum number of tokens to generate in the completion. -1 returns as many
     * tokens as possible given the prompt and the model's maximum context size.
     */
    maxTokens?: number;
    /** Total probability mass of tokens to consider at each step */
    topP?: number;
}

const openAiModels: IGptModelData[] = [
    {
        label: 'o3 mini', // **
        inputCost: 1.10,
        outputCost: 4.40,
        contextWindow: 200000,
        maxOutputTokens: 100000,
        speed: 3,
        reasoning: 4,
        reasoningTokens: true,
        value: 'o3-mini' as const
    },
    {
        label: 'o3', // **
        inputCost: 10.00,
        outputCost: 40.00,
        contextWindow: 200000,
        maxOutputTokens: 100000,
        speed: 1,
        reasoning: 5,
        reasoningTokens: true,
        value: 'o3-2025-04-16' as const
    },
    {
        label: 'GPT 4.1', // **
        inputCost: 2.0,
        outputCost: 8.0,
        contextWindow: 1047576,
        maxOutputTokens: 32768,
        speed: 3,
        reasoning: 4,
        reasoningTokens: false,
        value: 'gpt-4.1' as const
    },
    {
        label: 'GPT 4.1 nano', // **
        inputCost: 0.10,
        outputCost: 0.40,
        contextWindow: 1047576,
        maxOutputTokens: 32768,
        speed: 5,
        reasoning: 2,
        reasoningTokens: false,
        value: 'gpt-4.1-nano' as const
    },
    {
        label: 'GPT 4o mini', // **
        inputCost: 0.15,
        outputCost: 0.60,
        contextWindow: 128000,
        maxOutputTokens: 16384,
        speed: 4,
        reasoning: 3,
        reasoningTokens: false,
        value: 'gpt-4o-mini' as const
    },
    {
        label: 'o4 mini', // **
        inputCost: 1.1,
        outputCost: 4.4,
        contextWindow: 200000,
        maxOutputTokens: 100000,
        speed: 3,
        reasoning: 4,
        reasoningTokens: true,
        value: 'o4-mini' as const
    },
    {
        label: 'GPT 4.1 mini', // **
        inputCost: 0.40,
        outputCost: 1.60,
        contextWindow: 1047576,
        maxOutputTokens: 32768,
        speed: 4,
        reasoning: 3,
        reasoningTokens: false,
        value: 'gpt-4.1-mini' as const
    },
    {
        label: 'GPT 4o', // **
        inputCost: 2.50,
        outputCost: 10.00,
        contextWindow: 128000,
        maxOutputTokens: 16384,
        speed: 3,
        reasoning: 3,
        reasoningTokens: false,
        value: 'gpt-4o' as const
    },

    {
        label: 'GPT 5', // **
        inputCost: 1.25,
        outputCost: 10.00,
        contextWindow: 400000,
        maxOutputTokens: 128000,
        speed: 3,
        reasoning: 4,
        reasoningTokens: true,
        value: 'gpt-5' as const
    },
    {
        label: 'GPT 5 Mini', // **
        inputCost: 0.25,
        outputCost: 2.00,
        contextWindow: 400000,
        maxOutputTokens: 128000,
        speed: 4,
        reasoning: 3,
        reasoningTokens: true,
        value: 'gpt-5-mini' as const
    },
    {
        label: 'GPT 5 Nano', // **
        inputCost: 0.05,
        outputCost: 0.40,
        contextWindow: 400000,
        maxOutputTokens: 128000,
        speed: 5,
        reasoning: 2,
        reasoningTokens: true,
        value: 'gpt-5-nano' as const
    },
    {
        label: 'GPT 5 Chat', // **
        inputCost: 1.25,
        outputCost: 10.00,
        contextWindow: 400000,
        maxOutputTokens: 128000,
        speed: 3,
        reasoning: 3,
        reasoningTokens: true,
        value: 'gpt-5-chat' as const
    },
];

export const modelList = openAiModels
    .sort((x1, x2) => x1.inputCost - x2.inputCost)
    .map(l => new GptModelInfo(l));
