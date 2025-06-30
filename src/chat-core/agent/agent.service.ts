import { AgentInstanceConfiguration } from "./model/agent-instance-configuration.model";
import { AgentPluginBase } from "../agent-plugin/agent-plugin-base.service";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatRoom } from "./chat-room/chat-room.service";
import { ChatCallInfo, IChatLifetimeContributor } from "../chat-lifetime-contributor.interface";
import { MessagePositionTypes, PositionableMessage } from "./model/positionable-message.model";
import { BaseMessage, SystemMessage } from "@langchain/core/messages";
import { DynamicTool } from "@langchain/core/tools";

export class Agent implements IChatLifetimeContributor {
    // The configuration for this agent instance
    readonly config: AgentInstanceConfiguration;
    // The chat model used by this agent
    readonly chatModel: BaseChatModel;
    // Plugins (context plugins, tools, etc.)
    readonly plugins: AgentPluginBase[];

    constructor(config: AgentInstanceConfiguration, chatModel: BaseChatModel, plugins: AgentPluginBase[] = []) {
        this.config = config;
        this.chatModel = chatModel;
        this.plugins = plugins;
    }

    /** Returns the name of this agent, using either the name in the configuration, or
     *   the configuration's identity. */
    get myName(): string {
        return this.config.name ?? this.config.identity.chatName ?? this.config.identity.name;
    }

    chatRoom?: ChatRoom;

    async addPreChatMessages(info: ChatCallInfo): Promise<PositionableMessage[]> {
        // Resulting message list.
        const result = [] as PositionableMessage[];

        // Add the identity of this agent to the results.
        this.config.identity.identityStatements.forEach(m => {
            result.push({
                location: MessagePositionTypes.AbsoluteFirst,
                messages: [
                    new SystemMessage(m)
                ]
            });
        });

        // Now insert the instructions.
        this.config.identity.baseInstructions.forEach(m => {
            result.push({
                location: MessagePositionTypes.AbsoluteFirst,
                messages: [
                    new SystemMessage(m)
                ]
            });
        });

        // Return the results.
        return result;
    }

    async chatComplete(finalMessages: BaseMessage[]): Promise<void> {
        // Get the last message, and add our name to it.
        const lastMessage = finalMessages[finalMessages.length - 1];

        if (!lastMessage) {
            return;
        }

        lastMessage.name = this.myName;
    }
}