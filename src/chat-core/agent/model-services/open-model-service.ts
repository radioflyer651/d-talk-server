import { BaseChatModelParams, BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ModelServiceBase } from "./model-service-base.service";
import { ChatOpenAI } from "@langchain/openai";


export class OpenAiAgentService extends ModelServiceBase {
    /** The identifier for this service. */
    readonly serviceType = 'open-ai' as const;

    protected async getChatModelBase(params?: object): Promise<BaseChatModel> {
        const result = new ChatOpenAI(params);

        return result;
    }

    protected async validateParameters(params?: object): Promise<true | string[]> {
        // TODO: Add validation here.
        // For now - just getting things rolling.
        return true;
    }
}
