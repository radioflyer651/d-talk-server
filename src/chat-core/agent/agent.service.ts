import { AgentInstanceConfiguration } from "../../model/shared-models/chat-core/agent-instance-configuration.model";
import { AgentPluginBase } from "../agent-plugin/agent-plugin-base.service";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatRoom } from "./chat-room/chat-room.service";
import { ChatCallInfo, IChatLifetimeContributor } from "../chat-lifetime-contributor.interface";
import { MessagePositionTypes, PositionableMessage } from "./model/positionable-message.model";
import { BaseMessage, SystemMessage } from "@langchain/core/messages";
import { getIdForMessage } from "../utilities/set-message-id.util";
import { setSpeakerOnMessage } from "../utilities/speaker.utils";

export class Agent implements IChatLifetimeContributor {
    // The configuration for this agent instance
    readonly data: AgentInstanceConfiguration;
    // The chat model used by this agent
    readonly chatModel: BaseChatModel;
    // Plugins (context plugins, tools, etc.)
    readonly plugins: AgentPluginBase[];

    constructor(config: AgentInstanceConfiguration, chatModel: BaseChatModel, plugins: AgentPluginBase[] = []) {
        this.data = config;
        this.chatModel = chatModel;
        this.plugins = plugins;
    }

    /** Returns the name of this agent, using either the name in the configuration, or
     *   the configuration's identity. */
    get myName(): string {
        return this.data.name ?? this.data.identity.chatName ?? this.data.identity.name;
    }

    /** The chat room that this agent is currently in. */
    chatRoom?: ChatRoom;

    async addPreChatMessages(info: ChatCallInfo): Promise<PositionableMessage[]> {
        // Resulting message list.
        const result = [] as PositionableMessage[];

        // Add the identity of this agent to the results.
        this.data.identity.identityStatements.forEach(m => {
            result.push({
                location: MessagePositionTypes.Instructions,
                messages: [
                    new SystemMessage(m, { id: getIdForMessage() })
                ]
            });
        });

        // Now insert the instructions.
        this.data.identity.baseInstructions.forEach(m => {
            result.push({
                location: MessagePositionTypes.Instructions,
                messages: [
                    new SystemMessage(m, { id: getIdForMessage() })
                ]
            });
        });

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