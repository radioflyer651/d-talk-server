// LabeledMemory2Plugin stub
import { AgentPluginBase } from '../../agent-plugin/agent-plugin-base.service';
import { ChatCallInfo, IChatLifetimeContributor } from '../../chat-lifetime-contributor.interface';
import { LABELED_MEMORY2_PLUGIN_TYPE_ID } from '../../../model/shared-models/chat-core/plugins/plugin-type-constants.data';
import { PluginInstanceReference } from '../../../model/shared-models/chat-core/plugin-instance-reference.model';
import { PluginSpecification } from '../../../model/shared-models/chat-core/plugin-specification.model';
import { LabeledMemory2PluginParams } from '../../../model/shared-models/chat-core/plugins/labeled-memory-plugin2.params';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { MongoDbStore } from '../../../services/lang-chain/mongo-store.service';
import { AIMessage, BaseMessage, SystemMessage } from '@langchain/core/messages';
import { ToolInputSchemaBase } from '@langchain/core/dist/tools/types';
import { StructuredToolInterface, tool } from '@langchain/core/tools';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { z } from 'zod';
import { MessagePositionTypes, PositionableMessage } from '../../../model/shared-models/chat-core/positionable-message.model';

export class LabeledMemory2Plugin extends AgentPluginBase implements IChatLifetimeContributor {
    constructor(
        params: PluginInstanceReference<LabeledMemory2PluginParams> | PluginSpecification<LabeledMemory2PluginParams>,
        private readonly memoryService: MongoDbStore,
        private readonly aiModel: BaseChatModel,
    ) {
        super(params);
    }

    /** Current memories.  This value is cached when the plugin initializes. */
    private currentMemories: string = '';

    get agentUserManual(): string {
        const params = this.specification!.configuration;

        return `
        You have a memory module assistant that saves and returns memories back to you as appropriate.  The assistant works automatically without your involvement.
        As a clue to help you understand its memory concerns, it's recording the information the namespace and with the key ${params.memoryNamespace}, ${params.memoryKey}.
        `.replaceAll(/\t+/g, '');
    }

    /** Returns an identifier that can be used for referencing a specific memory, based on the memory's namespace and key. */
    get memoryIdentifier(): string {
        const params = this.specification.configuration;
        return `${params.memoryNamespace}.${params.memoryKey}`;
    }

    declare specification: PluginSpecification<LabeledMemory2PluginParams>;

    readonly type = LABELED_MEMORY2_PLUGIN_TYPE_ID;

    private async getCurrentMemories(): Promise<string> {
        const params = this.specification.configuration;

        const namespace = params.memoryNamespace.split('/');
        const result = await this.memoryService.get(namespace, params.memoryKey);

        if (!result) {
            return `${this.memoryIdentifier}: No memories have been stored yet.`;
        }

        return `
        Memories (${this.memoryIdentifier}): Created At: ${result?.createdAt.toISOString()}, Updated At: ${result?.updatedAt.toISOString()}, Content:\n\n${JSON.stringify(result.value)}
        `;
    }

    async addPreChatMessages(info: ChatCallInfo): Promise<PositionableMessage<BaseMessage>[]> {
        const instructions = `
        Ignore ALL PRIOR INSTRUCTIONS.
        You are a memory agent for another LLM agent.  You manage saving and storing memories discussed in the other agent's conversations.
        The agent is about to respond to the user.  Below are the memories you're managing.  Based on their conversation so far, you must return any information you're aware of FROM THE MEMORIES ONLY, that may be relevant to the conversation.
        You do NOT respond to the user.  They cannot see your content - only the LLM can, who you're supporting.  Do not attempt to interact with the user.
        ---
        Current Memories:
        ${this.currentMemories}
        `;

        const messageHistory = [...info.callMessages.filter(x => !(x instanceof SystemMessage)), new SystemMessage(instructions)];
        const response = await this.aiModel.invoke(messageHistory);

        return [{ location: MessagePositionTypes.Last, message: response }];
    }

    /** Returns the tools needed to save new memories.
     *   TODO: Revise this so it can be more fine-grained on each property of the memory.  This could get big.
     */
    private async getMemoryTools(): Promise<(ToolNode<any> | StructuredToolInterface<ToolInputSchemaBase, any, any>)[]> {
        const params = this.specification.configuration;
        const suffix = `${params.memoryCollectionName}_${params.memoryNamespace.replaceAll('/', '__')}_${params.memoryKey}`;
        const saveMemorySchema = {
            name: `save_memories_${suffix}`,
            description: `Resplaces (or creates) the stored memory for reference ${this.memoryIdentifier}.`,
            schema: z.object({
                newValue: z.object({}).passthrough().describe(`The new memory object.  This is of whatever form you choose, and replaces the old memory value completely.`)
            })
        };

        const toolDef = tool(
            async (options: z.infer<typeof saveMemorySchema.schema>) => {
                const namespace = params.memoryNamespace.split('/');
                await this.memoryService.put(namespace, params.memoryKey, options.newValue);
            },
            saveMemorySchema
        );

        return [toolDef];
    }

    async chatComplete(finalMessages: BaseMessage[], newMessages: BaseMessage[]): Promise<void> {
        // Get the tools for this operation.
        const tools = await this.getMemoryTools();

        // Get the current memory set.
        const currentMemories = this.currentMemories;

        const instructions = `
        You are an assistant to store memories for another chat agent.
        The memory reference you are working with is ${this.memoryIdentifier}.
        The previous message set is the conversation currently being conducted by the other chat agent.
        From this information, you must decide what memories to store/update.  Use the provided tools to perform your job.
        IMPORTANT: DO NOT REPLY TO THE MESSAGE, ONLY MAKE A TOOL CALL, OR RESPOND WITH AN EMPTY RESPONSE.
        ----
        The following are instructions regarding these memories:
        ${this.specification.configuration.memorySetInstructions}
        -----
        The following are the current memories:
        ${currentMemories}
        `.replaceAll(/^\t+/g, '');

        // Create the new chat history with the new message.
        const history = [...finalMessages.filter(x => !(x instanceof SystemMessage)), new SystemMessage(instructions)];

        // Make the LLM call.
        const result = await this.aiModel.bindTools!(tools).invoke(history);

        if (result.tool_calls && result.tool_calls.length > 0) {
            if (result.tool_calls.length !== 1) {
                console.error(`Toolcall length is greater than 1!`, result.tool_calls);
            }

            for (let tc of result.tool_calls) {
                const tool = tools.find(t => t.name === tc.name);
                if (!tool) {
                    console.error(`Tool ${tc.name} not found.`);
                    continue;
                }

                await tool.invoke(tc.args);
            }
        }
    }

    async initialize(): Promise<void> {
        this.currentMemories = await this.getCurrentMemories();
    }
}
