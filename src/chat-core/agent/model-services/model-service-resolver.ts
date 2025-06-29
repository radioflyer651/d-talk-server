import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ModelServiceBase } from "./model-service-base.service";
import { ModelServiceParams } from "../model/model-service-params.model";

/** Responsible for taking agent configurations and returning chat models for the configuration. */
export class ModelServiceResolver {
    constructor(
        protected readonly providerServices: ModelServiceBase[]
    ) {

    }

    /** Given a specified chat configuration, returns the chat model for it. */
    async getModel(configuration: ModelServiceParams): Promise<BaseChatModel> {
        // Find the service to produce this agent.
        const service = this.providerServices.find(p => p.serviceType === configuration.llmService);

        // If not found, then we have a problem.
        if (!service) {
            throw new Error(`No model service was found for the service type: ${configuration.llmService}`);
        }

        // Return the model.
        return await service.getChatModel(configuration.serviceParams);
    }
};