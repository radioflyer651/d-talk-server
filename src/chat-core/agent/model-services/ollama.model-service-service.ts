import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ModelServiceBase } from "./model-service-base.service";
import { ChatOllama, ChatOllamaInput } from "@langchain/ollama";
import { OllamaModelParams, OllamaModelServiceParams } from "../../../model/shared-models/chat-core/chat-model-params/ollama.model-params";
import { CustomChatFormatting, ModelServiceParams } from "../../../model/shared-models/chat-core/model-service-params.model";
import { OllamaModelConfigurationDbService } from "../../../database/chat-core/ollama-configurations-db.service";


export class OllamaAiAgentService extends ModelServiceBase {
    constructor(
        readonly ollamaModelConfigDbService: OllamaModelConfigurationDbService,
    ) {
        super();
        if (!ollamaModelConfigDbService) {
            throw new Error(`ollamaModelConfigDbService must be set.`);
        }
    }

    /** The identifier for this service. */
    readonly serviceType: OllamaModelParams['llmService'] = 'ollama' as const;

    protected async getChatModelBase(params: ModelServiceParams<OllamaModelServiceParams>): Promise<BaseChatModel> {
        const { modelId, ...validParams } = params.serviceParams;

        // Get the data for this item.
        const modelData = await this.ollamaModelConfigDbService.getOllamaModelConfigurationById(modelId);

        // If we don't have this, then we can't proceed.
        if (!modelData) {
            throw new Error(`Model data for ID ${modelId} was not found.`);
        }

        // Create the parameters for the model creation.
        const ollamaParams: ChatOllamaInput = {
            ...validParams,
            model: modelData.modelName,
        };

        // Create and return the model.
        return new ChatOllama(ollamaParams);
    }

    protected async validateParameters(params: OllamaModelServiceParams): Promise<true | string[]> {
        if (!params) {
            return ['Params not provided.'];
        }

        if (!params.modelId) {
            return ['model ID not specified.'];
        }

        // For now - just getting things rolling.
        return true;
    }

    /** When overridden by the subclass, returns custom chat formatting needed for the provided model. */
    async getModelFormatting(configuration: ModelServiceParams<OllamaModelServiceParams>): Promise<CustomChatFormatting | undefined> {
        // Get the data for this item.
        const modelData = await this.ollamaModelConfigDbService.getOllamaModelConfigurationById(configuration.serviceParams.modelId);

        if (!modelData) {
            throw new Error(`No model data was found for id ${configuration.serviceParams.modelId}`);
        }

        return modelData.customFormatting;
    }
}
