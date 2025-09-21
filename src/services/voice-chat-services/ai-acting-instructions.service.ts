import { AIMessage, BaseMessage, mapStoredMessageToChatMessage, SystemMessage } from '@langchain/core/messages';
import { ModelServiceResolver } from '../../chat-core/agent/model-services/model-service-resolver';
import { AiActingInstructionsConfiguration } from '../../model/shared-models/chat-core/voice/ai-acting-instructions-configuration.model';
import { getMessageId } from '../../model/shared-models/chat-core/utils/messages.utils';
import { insertPositionableMessages } from '../../chat-core/utilities/insert-positionable-messages.util';
import { ChatAgentIdentityConfiguration } from '../../model/shared-models/chat-core/agent-configuration.model';


/** Provides AI generated acting instructions for voice generation.
 *   NOTE: This service is meant to be instantiated inline.
 */
export class AiActingInstructionsService {
    constructor(
        private configuration: AiActingInstructionsConfiguration,
        private modelResolver: ModelServiceResolver,
    ) { }

    readonly constantInstructions = `
    **IMPORTANT: Ignore all previous instructions except personality considerations.**
    The system is generating voice audio for your chat message, which you will be responsible for.`;

    private readonly userInstructionPreamble = `Before generating the acting instructions, complete the following exercises.`;

    readonly finalInstructions = `
    # Instructions:
      - Keep your reply short - no more than 2 sentences.
      - State the emotion and tone of the voice.
      - If applicable to the situation, include any structural elements for the speech pattern.

    **Now, generate the "acting instructions" for the generation, based on the context of your conversation.**`;

    async generateAiActingInstructions(message: string, messageId: string | undefined, messageHistory: BaseMessage[], agent: ChatAgentIdentityConfiguration): Promise<string | undefined> {
        // Get an LLM to work with.
        const llm = await this.modelResolver.getModel(this.configuration.modelParams);

        // Create a copy of the message history, so we can modify it.
        const localMessageHistory = [...messageHistory];

        // Remove all messages at and after the current message's location.
        this.truncateMessageHistoryForTarget(localMessageHistory, messageId, message);

        // Convert the stored messages in the agent's identity to base messages.
        const agentIdentity = agent.identityStatements.map(pm => ({ ...pm, message: mapStoredMessageToChatMessage(pm.message) }));

        // Add the agent's personality to the history.
        insertPositionableMessages(agentIdentity, localMessageHistory);

        // Add the current message back.
        //  If it wasn't found in the message history, for whatever reason,
        //  we need to add it here.  Besides, we want it dead last.
        localMessageHistory.push(new AIMessage(message));

        // Add an instruction to tell the LLM that it's no longer doing what it's supposed to be doing.
        localMessageHistory.push(new SystemMessage(this.constantInstructions));

        // Now add instructions for conversion.
        if (this.configuration.modelInstructions && this.configuration.modelInstructions.length > 0) {
            // Inform the AI that it must complete the following tasks first.
            localMessageHistory.push(new SystemMessage(this.userInstructionPreamble));

            for (let i = 0; i < this.configuration.modelInstructions.length; i++) {
                // Insert the current message into the history.
                localMessageHistory.push(new SystemMessage(this.configuration.modelInstructions[i]));

                // Execute the LLM call.
                const llmResponse = await llm.invoke(localMessageHistory);

                // Add the response to the history.
                localMessageHistory.push(llmResponse);
            }
        }

        // Now, instruct the LLM to generate the result, if required.
        if (!this.configuration.excludeFinalInstructionForActingResponse || this.configuration.modelInstructions.length < 0) {
            localMessageHistory.push(new SystemMessage(this.finalInstructions));
            const finalResponse = await llm.invoke(localMessageHistory);
            localMessageHistory.push(finalResponse);
        }

        // Get the final response, and return just the texts.
        const finalValue = localMessageHistory[localMessageHistory.length - 1];
        return finalValue.text;
    }

    /** Finds a specified target message, and removes all messages after it. */
    private truncateMessageHistoryForTarget(messageHistory: BaseMessage[], messageId: string | undefined, messageContent: string) {
        // Try to find the index of the message.
        let index: number = -1;
        if (typeof messageId === 'number') {
            index = messageHistory.findIndex(m => getMessageId(m) === messageId);
        }

        // If we didn't find the message yet, then try to do it using the message's content.
        if (index < 1) {
            index = messageHistory.findIndex(m => m.content === messageContent);
        }

        // If still not found, we can't do anything.
        if (index < 1) {
            return;
        }

        // Remove everything after the index we found.
        messageHistory.splice(index);
    }

    /** Static method to create a new AiActingInstructionsService, and return the result of the generateAiActingInstructions method. */
    static async generateAiActingInstructionsStatic(
        configuration: AiActingInstructionsConfiguration,
        modelResolver: ModelServiceResolver,
        message: string, messageId: string | undefined,
        messageHistory: BaseMessage[],
        agent: ChatAgentIdentityConfiguration): Promise<string | undefined> {

        // Create a new instance of this class.
        const service = new AiActingInstructionsService(configuration, modelResolver);

        // Call the method, and return the result.
        return await service.generateAiActingInstructions(message, messageId, messageHistory, agent);
    }
}