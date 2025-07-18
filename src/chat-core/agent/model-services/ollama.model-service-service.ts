import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ModelServiceBase } from "./model-service-base.service";
import { ChatOllama, ChatOllamaInput } from "@langchain/ollama";
import { OllamaModelParams, OllamaModelServiceParams } from "../../../model/shared-models/chat-core/chat-model-params/ollama.model-params";
import { CustomChatFormatting, ModelServiceParams } from "../../../model/shared-models/chat-core/model-service-params.model";


export class OllamaAiAgentService extends ModelServiceBase {
    /** The identifier for this service. */
    readonly serviceType: OllamaModelParams['llmService'] = 'ollama' as const;

    protected async getChatModelBase(params: ModelServiceParams<OllamaModelServiceParams>): Promise<BaseChatModel> {
        const { chatFormatting, ...validParams } = params;

        // Create the parameters for the model creation.
        const ollamaParams: ChatOllamaInput = {
            ...validParams.serviceParams,
        };

        // Create and return the model.
        return new ChatOllama(ollamaParams);
    }

    protected async validateParameters(params: OllamaModelServiceParams): Promise<true | string[]> {
        if (!params) {
            return ['Params not provided.'];
        }

        if (!params?.model || params.model.trim() === '') {
            return ['model not specified.'];
        }

        // For now - just getting things rolling.
        return true;
    }

    /** When overridden by the subclass, returns custom chat formatting needed for the provided model. */
    async getModelFormatting(configuration: ModelServiceParams): Promise<CustomChatFormatting | undefined> {
        return undefined;
    }
}
