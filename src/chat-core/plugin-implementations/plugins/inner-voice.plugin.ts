import { AgentPluginBase } from "../../agent-plugin/agent-plugin-base.service";
import { PluginInstanceReference } from "../../../model/shared-models/chat-core/plugin-instance-reference.model";
import { INNER_VOICE_PLUGIN_TYPE_ID } from "../../../model/shared-models/chat-core/plugins/plugin-type-constants.data";
import { InnerVoicePluginParams } from "../../../model/shared-models/chat-core/plugins/inner-voice-plugin.params";
import { PluginSpecification } from "../../../model/shared-models/chat-core/plugin-specification.model";
import { IChatLifetimeContributor } from "../../chat-lifetime-contributor.interface";
import { LifetimeContributorPriorityTypes } from "../../lifetime-contributor-priorities.enum";
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { copyBaseMessages } from "../../../utils/copy-base-message.utils";
import { getMessageSource, MessageSourceTypes } from '../../../model/shared-models/chat-core/utils/messages.utils';
import { ModelServiceResolver } from "../../agent/model-services/model-service-resolver";

export class InnerVoicePlugin extends AgentPluginBase implements IChatLifetimeContributor {
    constructor(
        params: PluginInstanceReference<InnerVoicePluginParams> | PluginSpecification<InnerVoicePluginParams>,
        readonly modelResolver: ModelServiceResolver
    ) {
        super(params);
    }

    agentUserManual?: string | undefined = "This plugin provides an inner monologue for the agent, visible only to itself.";
    readonly type = INNER_VOICE_PLUGIN_TYPE_ID;

    declare specification: PluginSpecification<InnerVoicePluginParams>;

    priority: LifetimeContributorPriorityTypes = LifetimeContributorPriorityTypes.NearestToAgentCall;

    /** Given a message as a string, returns the proper type of BaseMessage, based on the configuration. */
    private createChatMessage(message: string): BaseMessage {
        const messageType = this.specification.configuration.callType;

        if (messageType === 'system') {
            return new SystemMessage(message);
        } else if (messageType === 'user') {
            return new HumanMessage(message);
        } else {
            throw new Error(`Unexpected message type: ${messageType}`);
        }
    }

    /** Removes all excluded source-type messages from a specified list of messages, and returns a filtered list. */
    private removeExcludedSourceMessages(messages: BaseMessage[]) {
        const params = this.specification.configuration;
        const keepTypes: MessageSourceTypes[] = [];

        if (!params.excludeAgentIdentityMessages) {
            keepTypes.push('agent-identity');
        }
        if (!params.excludeAgentInstructionMessages) {
            keepTypes.push('agent-instructions');
        }
        if (!params.excludeChatRoomMessages) {
            keepTypes.push('chat-room');
        }
        if (!params.excludeJobMessages) {
            keepTypes.push('job');
        }
        if (!params.excludePluginMessages) {
            keepTypes.push('plugin');
        }
        if (!params.excludeProjectMessages) {
            keepTypes.push('project');
        }

        return messages.filter(m => {
            const source = getMessageSource(m);
            return !source || keepTypes.includes(source);
        });
    }

    private async getAiModel() {
        const params = this.specification.configuration;
        if (params.useDefaultLlm) {
            return this.agent.chatModel;
        } else {
            return await this.modelResolver.getModel(params.modelServiceParams!);
        }
    }

    async inspectChatCallMessages(callMessages: BaseMessage[], chatHistory: BaseMessage[]): Promise<void> {
        const params = this.specification.configuration;
        if (params.messageList.length > 0) {
            // Get the chat model from the agent.
            const model = await this.getAiModel();

            // Create a copy of the chat history for our own chat calls.
            let historyCopy = copyBaseMessages(callMessages);

            // Remove the unwanted message types.
            historyCopy = this.removeExcludedSourceMessages(historyCopy);

            // Get the last message for later use.
            const lastMessage = chatHistory[chatHistory.length - 1];
            let lastMessageText = '';
            if (lastMessage) {
                lastMessageText = lastMessage.text;
            }

            // Copy the message list, and replace any replacement targets.
            const messageList = params.messageList.map(m => m.replaceAll(/\{last-message\}/gi, lastMessageText));

            // Remove the last item if required.
            if (!params.considerLastMessageInResponse) {
                historyCopy.pop();
            }

            if (params.addDummyAiMessageBeforeInnerDialog) {
                historyCopy.push(new AIMessage(''));
            }

            // Create a list where we'll store the message calls we're about to make.
            const messageCalls: BaseMessage[] = [];

            const includeLastMessage = params.responseToLastInnerVoiceMessage;
            const lastMessageIndex = includeLastMessage ? messageList.length : messageList.length - 1;

            // Make the chat calls.
            for (let i = 0; i < lastMessageIndex; i++) {
                // Get the next message.
                const message = this.createChatMessage(messageList[i]);

                // Add this to the call messages and the eventual result.
                historyCopy.push(message);
                messageCalls.push(message);

                // Make the call.
                const reply = await model.invoke(historyCopy);

                // Add the reply to the history and the eventual result.
                historyCopy.push(reply);
                messageCalls.push(reply);

                if (params.debug) {
                    console.log(reply.text.replaceAll(/(\\+r)?(\\)+n/g, '\n'));
                }
            }

            if (!includeLastMessage) {
                const lastMessage = this.createChatMessage(messageList[params.messageList.length - 1]);
                messageCalls.push(lastMessage);
            }

            // All resulting messages should be placed just before the last message.
            callMessages.splice(callMessages.length - 1, 0, ...messageCalls);
        }
    }
}
