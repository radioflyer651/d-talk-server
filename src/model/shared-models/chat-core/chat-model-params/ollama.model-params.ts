import { ModelServiceParams } from "../model-service-params.model";

export interface OllamaModelParams extends ModelServiceParams<OllamaModelServiceParams> {
    llmService: 'ollama';
}

export interface OllamaModelServiceParams {
    model: string;
    numPredict?: number;
    temperature?: number;
    keepAlive?: string | number; // default 5m.
    format?: string;
}
