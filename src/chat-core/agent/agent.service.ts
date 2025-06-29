import { AgentInstanceConfiguration } from "./model/agent-instance-configuration.model";
import { AgentPluginBase } from "../agent-plugin/agent-plugin-base.service";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatRoom } from "./chat-room/chat-room.service";

export class Agent {
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

    chatRoom?: ChatRoom;
}