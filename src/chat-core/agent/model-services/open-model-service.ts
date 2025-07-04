import { BaseChatModelParams, BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ModelServiceBase } from "./model-service-base.service";
import { ChatOpenAI, ChatOpenAIFields } from "@langchain/openai";
import { OpenAiModelParams, OpenAiModelServiceParams } from "../../../model/shared-models/chat-core/chat-model-params/open-ai/openai.model-params";


export class OpenAiAgentService extends ModelServiceBase {
    /** The identifier for this service. */
    readonly serviceType: OpenAiModelParams['llmService'] = 'open-ai';

    protected async getChatModelBase(params: OpenAiModelServiceParams): Promise<BaseChatModel> {
        const openAiParams: ChatOpenAIFields = {
            model: params.model
        };

        return new ChatOpenAI(openAiParams);
    }

    protected async validateParameters(params: OpenAiModelServiceParams): Promise<true | string[]> {
        if (!params) {
            return ['Params not provided.'];
        }

        if (!params?.model || params.model.trim() === '') {
            return ['model not specified.'];
        }

        // For now - just getting things rolling.
        return true;
    }
}
