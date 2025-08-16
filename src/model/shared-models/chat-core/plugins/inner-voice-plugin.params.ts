
/** Parameters for the InnerVoicePlugin. */
export interface InnerVoicePluginParams {
    /** A list of chat messages to give to the AI and executed, one at a time.
     *   Each item in the list is meant to build up ai-generated context to use in a final answer. */
    messageList: string[];

    /** Gets or sets the type of message that is expected for this set of AI calls. */
    callType: 'user' | 'system';

    /** Boolean value indicating whether or not the AI should provide a response
     *   for the last inner voice message.  If not, this acts as an instruction, typically indicating 
     *   what to do with the previous responses.
     */
    responseToLastInnerVoiceMessage: boolean;

    /** Boolean value indicating whether or not the last message in chat should be
     *   part of the message history when processing the inner voice messages.
     */
    considerLastMessageInResponse: boolean;

    /** Boolean value indicating whether or not a dummy AI message will be added to the chat history
     *   to attempt to block the AI from trying to respond to the last message in the chat.
     */
    addDummyAiMessageBeforeInnerDialog: boolean;

    /** Boolean value indicating whether or not messages from the chat room can be in the inner voice context. */
    excludeChatRoomMessages: boolean;
    /** Boolean value indicating whether or not messages from the job can be in the inner voice context. */
    excludeJobMessages: boolean;
    /** Boolean value indicating whether or not messages from the agent identity can be in the inner voice context. */
    excludeAgentIdentityMessages: boolean;
    /** Boolean value indicating whether or not messages from the agent instructions can be in the inner voice context. */
    excludeAgentInstructionMessages: boolean;
    /** Boolean value indicating whether or not messages from plugins room can be in the inner voice context. */
    excludePluginMessages: boolean;
    /** Boolean value indicating whether or not messages from the project can be in the inner voice context. */
    excludeProjectMessages: boolean;

    debug?: boolean;
}
