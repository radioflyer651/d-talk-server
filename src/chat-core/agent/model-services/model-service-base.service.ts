import { BaseChatModel, BaseChatModelParams } from "@langchain/core/language_models/chat_models";
import { CustomChatFormatting, ModelServiceParams } from "../../../model/shared-models/chat-core/model-service-params.model";

/** Service that will return chat models for specific chat model services. */
export abstract class ModelServiceBase {
    /** Unique identifier for this chat service type. */
    abstract readonly serviceType: string;

    /** Returns a BaseChatModel to perform AI chat interactions with.
     *   Because every chat model has their own parameters, the parameters
     *   must be loosely typed. */
    protected abstract getChatModelBase(params?: ModelServiceParams): Promise<BaseChatModel>;

    /** Returns a boolean value indicating whether or not a specified object represents
     *   valid parameters for agent creation. Either true, or a list of error messages is returned.*/
    protected abstract validateParameters(params?: object): Promise<true | string[]>;

    /** Returns the chat model for this implementation. */
    async getChatModel(params?: ModelServiceParams): Promise<BaseChatModel> {
        // Validate the parameters first.
        const paramValidation = await this.validateParameters(params?.serviceParams);
        if (paramValidation !== true) {

            throw new Error(`Invalid parameters:\n${paramValidation.join('\n')}`);
        }

        // Return the chat model.
        return await this.getChatModelBase(params);
    }

    /** When overridden by the subclass, returns custom chat formatting needed for the provided model. */
    async getModelFormatting(configuration: ModelServiceParams): Promise< CustomChatFormatting | undefined >{
        return undefined;
    }
}
