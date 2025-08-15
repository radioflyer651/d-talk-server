import { AgentPluginBase } from "../../agent-plugin/agent-plugin-base.service";
import { PluginInstanceReference } from "../../../model/shared-models/chat-core/plugin-instance-reference.model";
import { INNER_VOICE_PLUGIN_TYPE_ID } from "../../../model/shared-models/chat-core/plugins/plugin-type-constants.data";
import { InnerVoicePluginParams } from "../../../model/shared-models/chat-core/plugins/inner-voice-plugin.params";
import { PluginSpecification } from "../../../model/shared-models/chat-core/plugin-specification.model";
import { ChatCallInfo, IChatLifetimeContributor } from "../../chat-lifetime-contributor.interface";
import { LifetimeContributorPriorityTypes } from "../../lifetime-contributor-priorities.enum";
import { BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { MessagePositionTypes, PositionableMessage } from '../../../model/shared-models/chat-core/positionable-message.model';
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { copyBaseMessages } from "../../../utils/copy-base-message.utils";

export class InnerVoicePlugin extends AgentPluginBase implements IChatLifetimeContributor {
    constructor(params: PluginInstanceReference<InnerVoicePluginParams> | PluginSpecification<InnerVoicePluginParams>) {
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

    // async addPreChatMessages(info: ChatCallInfo): Promise<PositionableMessage<BaseMessage>[]> {
    //     const params = this.specification.configuration;
    //     if (info.replyNumber === 0 && params.messageList.length > 0) {
    //         // Get the chat model from the agent.
    //         const model = this.agent.chatModel;

    //         // Create a copy of the chat history for our own chat calls.
    //         const historyCopy = copyBaseMessages(info.callMessages);

    //         // Remove the last item.  That's just how this will go.
    //         historyCopy.pop();

    //         // Create a list where we'll store the message calls we're about to make.
    //         const messageCalls: BaseMessage[] = [];

    //         // Make the chat calls.
    //         for (let i = 0; i < params.messageList.length; i++) {
    //             // Get the next message.
    //             const message = this.createChatMessage(params.messageList[i]);

    //             // Add this to the call messages and the eventual result.
    //             historyCopy.push(message);
    //             messageCalls.push(message);

    //             // Make the call.
    //             const reply = await model.invoke(historyCopy);

    //             // Add the reply to the history and the eventual result.
    //             historyCopy.push(reply);
    //             messageCalls.push(reply);
    //         }

    //         // All resulting messages should be placed just before the last message.
    //         return messageCalls.map(m => (<PositionableMessage<BaseMessage>>{
    //             location: MessagePositionTypes.OffsetFromEnd,
    //             offset: 1,
    //             description: 'Inner Voice Message', // Why not??!!
    //             message: m,
    //         }));
    //     }

    //     // Nothing to return.
    //     return [];
    // }


    async inspectChatCallMessages(callMessages: BaseMessage[], chatHistory: BaseMessage[]): Promise<void> {
        const params = this.specification.configuration;
        if (params.messageList.length > 0) {
            // Get the chat model from the agent.
            const model = this.agent.chatModel;

            // Create a copy of the chat history for our own chat calls.
            const historyCopy = copyBaseMessages(callMessages);

            // Remove the last item.  That's just how this will go.
            historyCopy.pop();

            // Create a list where we'll store the message calls we're about to make.
            const messageCalls: BaseMessage[] = [];

            const includeLastMessage = params.messageList.length === 1;
            const lastMessageIndex = includeLastMessage ? params.messageList.length : params.messageList.length - 1;

            // Make the chat calls.
            for (let i = 0; i < lastMessageIndex; i++) {
                // Get the next message.
                const message = this.createChatMessage(params.messageList[i]);

                // Add this to the call messages and the eventual result.
                historyCopy.push(message);
                messageCalls.push(message);

                // Make the call.
                const reply = await model.invoke(historyCopy);

                // Add the reply to the history and the eventual result.
                historyCopy.push(reply);
                messageCalls.push(reply);

                // console.log(reply.text);
            }

            if (!includeLastMessage) {
                const lastMessage = this.createChatMessage(params.messageList[params.messageList.length - 1]);
                messageCalls.push(lastMessage);
            }

            // All resulting messages should be placed just before the last message.       
            callMessages.splice(callMessages.length - 1, 0, ...messageCalls);
        }
    }
}
