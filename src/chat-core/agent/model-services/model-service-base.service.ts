import { BaseChatModel, BaseChatModelParams } from "@langchain/core/language_models/chat_models";

/** Service that will return chat models for specific chat model services. */
export abstract class ModelServiceBase {
    /** Unique identifier for this chat service type. */
    abstract readonly serviceType: string;

    /** Returns a BaseChatModel to perform AI chat interactions with.
     *   Because every chat model has their own parameters, the parameters
     *   must be loosely typed. */
    protected abstract getChatModelBase(params?: object): Promise<BaseChatModel>;

    /** Returns a boolean value indicating whether or not a specified object represents
     *   valid parameters for agent creation. Either true, or a list of error messages is returned.*/
    protected abstract validateParameters(params?: object): Promise<true | string[]>;

    /** Returns the chat model for this implementation. */
    async getChatModel(params?: object): Promise<BaseChatModel> {
        // Validate the parameters first.
        const paramValidation = await this.validateParameters(params);
        if (paramValidation !== true) {

            throw new Error(`Invalid parameters:\n${paramValidation.join('\n')}`);
        }

        // Return the chat model.
        return await this.getChatModelBase(params);
    }
}
