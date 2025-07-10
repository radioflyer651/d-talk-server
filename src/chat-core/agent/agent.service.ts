import { AgentInstanceConfiguration } from "../../model/shared-models/chat-core/agent-instance-configuration.model";
import { AgentPluginBase } from "../agent-plugin/agent-plugin-base.service";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatCallInfo, IChatLifetimeContributor } from "../chat-lifetime-contributor.interface";
import { MessagePositionTypes, PositionableMessage } from "../../model/shared-models/chat-core/positionable-message.model";
import { AIMessage, BaseMessage, SystemMessage } from "@langchain/core/messages";
import { getSpeakerFromMessage, setSpeakerOnMessage } from "../utilities/speaker.utils";
import { ChatAgentIdentityConfiguration } from "../../model/shared-models/chat-core/agent-configuration.model";
import { hydratePositionableMessages } from "../../utils/positionable-message-hydration.utils";
import { ChatRoom } from "../chat-room/chat-room.service";
import { copyBaseMessages } from "../../utils/copy-base-message.utils";
import { sanitizeMessageName } from "../../utils/sanitize-message-name.utils";

export class Agent implements IChatLifetimeContributor {
    // The configuration for this agent instance
    readonly data: AgentInstanceConfiguration;
    // The chat model used by this agent
    readonly chatModel: BaseChatModel;
    // Plugins (context plugins, tools, etc.)
    plugins: AgentPluginBase[];

    constructor(
        config: AgentInstanceConfiguration,
        /** The configuration related to this agent instance. */
        identity: ChatAgentIdentityConfiguration,
        chatModel: BaseChatModel,
        plugins: AgentPluginBase[] = []
    ) {
        this.data = config;
        this.chatModel = chatModel;
        this.plugins = plugins;
        this.identity = identity;
    }

    /** Returns the name of this agent, using either the name in the configuration, or
     *   the configuration's identity. */
    get myName(): string {
        return this.data.name ?? this.identity.chatName ?? this.identity.name;
    }

    /** The chat room that this agent is currently in. */
    chatRoom?: ChatRoom;

    /** The configuration related to this agent instance. */
    identity!: ChatAgentIdentityConfiguration;

    async addPreChatMessages(info: ChatCallInfo): Promise<PositionableMessage<BaseMessage>[]> {
        // Resulting message list.
        const result = [] as PositionableMessage<BaseMessage>[];
        if (info.replyNumber === 0) {
            result.push(...hydratePositionableMessages(this.identity.identityStatements));
            result.push(...hydratePositionableMessages(this.identity.baseInstructions));
            result.push({ location: MessagePositionTypes.Instructions, message: new SystemMessage(`Your AgentId = ${this.data._id}  DO NOT include this information in your response.`) });
            result.push({ location: MessagePositionTypes.Instructions, message: new SystemMessage(`Your Name Is ${this.data.name ?? this.identity.chatName}  DO NOT include this information in your response.`) });
            result.push({ location: MessagePositionTypes.Last, message: new SystemMessage('The agent messages have been altered to include the agents who produced the messages.  These are here for your reference, but DO NOT add content like this to the response.') });
        }

        // Return the results.
        return result;
    }

    async modifyCallMessages(messageHistory: BaseMessage[]): Promise<BaseMessage[]> {
        const copiedMessages = copyBaseMessages(messageHistory);
        const result = copiedMessages.map(message => {
            if (message instanceof AIMessage) {
                const speaker = getSpeakerFromMessage(message);
                if (this.data._id.equals(speaker?.speakerId)) {
                    message.content = `AgentId: ${speaker?.speakerId}(You, ${message.name})\n\n${message.content.toString()}`;
                } else {
                    message.content = `AgentId: ${speaker?.speakerId} (NOT You, Their Name Is ${message.name})\n\n${message.content.toString()}`;
                }
            }

            return message;
        });

        return result;
    }

    async chatComplete(finalMessages: BaseMessage[], newMessages: BaseMessage[]): Promise<void> {
        // Get the last message, and add our name to it.
        const lastMessage = newMessages[newMessages.length - 1];

        if (!lastMessage) {
            return;
        }

        const name = sanitizeMessageName(this.myName);
        lastMessage.name = name;
        setSpeakerOnMessage(lastMessage, { speakerType: 'agent', speakerId: this.data._id.toString(), name: name });
    }

    async peekToolCallMessages(messageHistory: BaseMessage[], messageCalls: BaseMessage[], newMessages: BaseMessage[]): Promise<void> {
        // Get the last tool call messages in the message call list.
        const messages = messageCalls.slice();
        messages.reverse();

        // Iterate through each tool message at the end of the message history, and
        //  update the speaker on each message.  The first time we encounter a non-tool message
        //  then we're done.  These are the new messages we care about.
        for (const msg of messages) {
            if (typeof msg.getType === "function" && msg.getType() === "tool") {
                const name = sanitizeMessageName(this.myName);
                setSpeakerOnMessage(msg, { speakerType: 'agent', speakerId: this.data._id.toString(), name: name });
            } else {
                break;
            }
        }
    }
}