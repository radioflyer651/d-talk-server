import { AgentInstanceConfiguration } from "../../model/shared-models/chat-core/agent-instance-configuration.model";
import { AgentPluginBase } from "../agent-plugin/agent-plugin-base.service";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatRoom } from "./chat-room/chat-room.service";
import { ChatCallInfo, IChatLifetimeContributor } from "../chat-lifetime-contributor.interface";
import { PositionableMessage } from "../../model/shared-models/chat-core/positionable-message.model";
import { BaseMessage } from "@langchain/core/messages";
import { setSpeakerOnMessage } from "../utilities/speaker.utils";
import { ChatAgentIdentityConfiguration } from "../../model/shared-models/chat-core/agent-configuration.model";
import { hydratePositionableMessages } from "../../utils/positionable-message-hydration.utils";

export class Agent implements IChatLifetimeContributor {
    // The configuration for this agent instance
    readonly data: AgentInstanceConfiguration;
    // The chat model used by this agent
    readonly chatModel: BaseChatModel;
    // Plugins (context plugins, tools, etc.)
    readonly plugins: AgentPluginBase[];

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
        }

        // Return the results.
        return result;
    }

    async chatComplete(finalMessages: BaseMessage[], newMessages: BaseMessage[]): Promise<void> {
        // Get the last message, and add our name to it.
        const lastMessage = newMessages[newMessages.length - 1];

        if (!lastMessage) {
            return;
        }

        lastMessage.name = this.myName;
        setSpeakerOnMessage(lastMessage, { speakerType: 'agent', speakerId: this.data._id.toString() });
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
                setSpeakerOnMessage(msg, { speakerType: 'agent', speakerId: this.data._id.toString() });
            } else {
                break;
            }
        }
    }
}