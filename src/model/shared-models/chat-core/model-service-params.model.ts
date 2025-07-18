/** The configurable items to define a chat model service needed to generate the chat model for an agent. */
export interface ModelServiceParams<T extends object = object> {
    /** The type of LLM service being used for this agent (i.e. OpenAI, Anthropic, etc)   This will be used to generate the new Chat agent service.*/
    llmService: string;

    /** The parameters to provide to the chat service upon creation.
     *   Since each service is different, this value will differ. */
    serviceParams: T;

    chatFormatting?: CustomChatFormatting;
}

export interface ChatMarkers {
    openDelimiter: string;
    closeDelimiter: string;
}

export interface CustomChatFormatting {
    systemMarkers: ChatMarkers;
    userMarkers: ChatMarkers;
    aiMarkers: ChatMarkers;
}