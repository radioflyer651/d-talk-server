
/** Parameters for the InnerVoicePlugin. */
export interface InnerVoicePluginParams {
    /** A list of chat messages to give to the AI and executed, one at a time.
     *   Each item in the list is meant to build up ai-generated context to use in a final answer. */
    messageList: string[];

    /** Gets or sets the type of message that is expected for this set of AI calls. */
    callType: 'user' | 'system';
}
