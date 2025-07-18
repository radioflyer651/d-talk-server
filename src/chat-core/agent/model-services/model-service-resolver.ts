import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ModelServiceBase } from "./model-service-base.service";
import { CustomChatFormatting, ModelServiceParams } from "../../../model/shared-models/chat-core/model-service-params.model";

/** Responsible for taking agent configurations and returning chat models for the configuration. */
export class ModelServiceResolver {
    constructor(
        protected readonly providerServices: ModelServiceBase[]
    ) {

    }

    private getProviderServiceForConfiguration(configuration: ModelServiceParams): ModelServiceBase | undefined {
        return this.providerServices.find(p => p.serviceType === configuration.llmService);
    }

    /** Given a specified chat configuration, returns the chat model for it. */
    async getModel(configuration: ModelServiceParams): Promise<BaseChatModel> {
        // Find the service to produce this agent.
        const service = this.getProviderServiceForConfiguration(configuration);

        // If not found, then we have a problem.
        if (!service) {
            throw new Error(`No model service was found for the service type: ${configuration.llmService}`);
        }

        // Return the model.
        return await service.getChatModel(configuration);
    }

    /** Returns the custom chat format for a specified model, if there is one.  Otherwise undefined is returned. */
    async getModelFormatting(configuration: ModelServiceParams): Promise<CustomChatFormatting | undefined> {
        // Find the service to produce this agent.
        const service = this.getProviderServiceForConfiguration(configuration);

        // If not found, then we have a problem.
        if (!service) {
            throw new Error(`No model service was found for the service type: ${configuration.llmService}`);
        }

        // Return the format, if there was one.
        return service.getModelFormatting(configuration);
    }

};