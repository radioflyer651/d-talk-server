import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ModelServiceBase } from "./model-service-base.service";
import { ChatOllama } from "@langchain/ollama";


export class OllamaAiAgentService extends ModelServiceBase {
    /** The identifier for this service. */
    readonly serviceType = 'ollama' as const;

    protected async getChatModelBase(params?: object): Promise<BaseChatModel> {
        const result = new ChatOllama(params);

        return result;
    }

    protected async validateParameters(params?: object): Promise<true | string[]> {
        // TODO: Add validation here.
        // For now - just getting things rolling.
        return true;
    }
}
