import { AgentPluginBase } from "../../../agent-plugin/agent-plugin-base.service";
import { ChatCallInfo, IChatLifetimeContributor } from "../../../chat-lifetime-contributor.interface";
import { LABELED_MEMORY_PLUGIN_TYPE_ID } from "../../../../model/shared-models/chat-core/plugins/plugin-type-constants.data";
import { PluginInstanceReference } from "../../../../model/shared-models/chat-core/plugin-instance-reference.model";
import { PluginSpecification } from "../../../../model/shared-models/chat-core/plugin-specification.model";
import { LabeledMemoryPluginParams } from "../../../../model/shared-models/chat-core/plugins/labeled-memory-plugin.params";
import { MongoDbStore } from "../../../../services/lang-chain/mongo-store.service";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { getLabeledMemoryPluginGraph } from "./labeled-plugin-memory-plugin.graph";
import { BaseMessage } from "@langchain/core/messages";
import { LabeledMemoryPluginState } from "./labeled-plugin-memory-plugin.state";
import { MessagePositionTypes, PositionableMessage } from "../../../../model/shared-models/chat-core/positionable-message.model";

/**
 * Plugin: Labeled Memory
 * Adds a system message listing labeled memories for the agent.
 */
export class LabeledMemoryPlugin extends AgentPluginBase implements IChatLifetimeContributor {
    agentUserManual?: string | undefined;
    readonly type = LABELED_MEMORY_PLUGIN_TYPE_ID;

    constructor(
        params: PluginInstanceReference | PluginSpecification,
        private readonly memoryService: MongoDbStore,
        private readonly aiModel: BaseChatModel,
    ) {
        super(params);
    }

    declare specification?: PluginSpecification<LabeledMemoryPluginParams>;

    get params(): LabeledMemoryPluginParams {
        if (!this.specification) {
            throw new Error(`Specification is not set.`);
        }

        return this.specification.configuration;
    }

    private async getMemories(conversation: BaseMessage[]) {
        // Create the state for the graph.
        const state: Partial<typeof LabeledMemoryPluginState.State> = {
            chatModel: this.aiModel,
            originalChatHistory: conversation,
            operationType: 'retrieve',
            store: this.memoryService,
            memoryParams: this.params,
        };

        // Execute the graph.
        const graph = getLabeledMemoryPluginGraph();
        const result = await graph.invoke(state, { recursionLimit: 10, streamMode: undefined });

        // Return the resulting messages.
        return result.resultingMemoryMessages;
    }

    private async saveMemories(conversation: BaseMessage[]) {
        // Create the state for the graph.
        const state: Partial<typeof LabeledMemoryPluginState.State> = {
            chatModel: this.aiModel,
            originalChatHistory: conversation,
            operationType: 'store',
            store: this.memoryService,
            memoryParams: this.params,
        };

        // Execute the graph.
        const graph = getLabeledMemoryPluginGraph();
        const result = await graph.invoke(state, { recursionLimit: 10 });

        // There's nothing to do here - this is for storage.
    }

    async addPreChatMessages(info: ChatCallInfo): Promise<PositionableMessage<BaseMessage>[]> {
        if (info.replyNumber === 0) {
            // Get memory messages to add.
            const newMessages = await this.getMemories(info.callMessages);

            return newMessages.map(m => ({
                location: MessagePositionTypes.OffsetFromEnd,
                offset: 1,
                message: m
            }));
        }

        return [];
    }

    async chatComplete(finalMessages: BaseMessage[], newMessages: BaseMessage[]): Promise<void> {
        await this.saveMemories(finalMessages);
    }
}
