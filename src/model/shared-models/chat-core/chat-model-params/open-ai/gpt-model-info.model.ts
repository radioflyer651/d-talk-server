

export interface IGptModelData {
    label: string;
    value: string;

    inputCost: number;
    outputCost: number;
    contextWindow: number;
    maxOutputTokens: number;
    speed: number;
    reasoning: number;
    reasoningTokens: boolean;
}

export class GptModelInfo implements IGptModelData {
    constructor(
        modelData?: IGptModelData
    ) {
        if (modelData) {
            this.modelLabel = modelData.label;
            this.value = modelData.value;
            this.inputCost = modelData.inputCost;
            this.outputCost = modelData.outputCost;
            this.contextWindow = modelData.contextWindow;
            this.maxOutputTokens = modelData.maxOutputTokens;
            this.speed = modelData.speed;
            this.reasoning = modelData.reasoning;
            this.reasoningTokens = modelData.reasoningTokens;
        }
    }

    get label() {
        const hasReasoning = this.reasoningTokens ? 'R' : '';

        return `${this.modelLabel} ` +
            `(${this.inputCost.toFixed(2)}:${this.outputCost.toFixed(2)}, ` +
            `${this.speed}${this.reasoning}${hasReasoning} ` +
            `${(Math.floor(this.contextWindow / 1000)).toLocaleString()})`;
    }

    /** Gets or sets the model name, used in API calls. */
    value: string = '';
    /** Gets or sets the model's name. */
    modelLabel: string = '';

    inputCost: number = 0;
    outputCost: number = 0;
    contextWindow: number = 0;
    maxOutputTokens: number = 0;

    speed: number = 0;
    reasoning: number = 0;

    reasoningTokens: boolean = false;
}