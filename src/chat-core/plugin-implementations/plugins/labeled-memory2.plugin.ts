// LabeledMemory2Plugin stub
import { AgentPluginBase } from '../../agent-plugin/agent-plugin-base.service';
import { ChatCallInfo, IChatLifetimeContributor } from '../../chat-lifetime-contributor.interface';
import { LABELED_MEMORY2_PLUGIN_TYPE_ID } from '../../../model/shared-models/chat-core/plugins/plugin-type-constants.data';
import { PluginInstanceReference } from '../../../model/shared-models/chat-core/plugin-instance-reference.model';
import { PluginSpecification } from '../../../model/shared-models/chat-core/plugin-specification.model';
import { LabeledMemory2PluginParams } from '../../../model/shared-models/chat-core/plugins/labeled-memory-plugin2.params';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { MongoDbStore } from '../../../services/lang-chain/mongo-store.service';
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ToolInputSchemaBase } from '@langchain/core/dist/tools/types';
import { StructuredToolInterface, tool } from '@langchain/core/tools';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { z } from 'zod';
import { MessagePositionTypes, PositionableMessage } from '../../../model/shared-models/chat-core/positionable-message.model';
import { LongRunningTask } from '../../chat-room/long-running-tasks.service';
import { copyBaseMessages } from '../../../utils/copy-base-message.utils';
import { LifetimeContributorPriorityTypes } from '../../lifetime-contributor-priorities.enum';

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

    priority: LifetimeContributorPriorityTypes = LifetimeContributorPriorityTypes.WithHighestContext;

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
        const identity = `
            You are a memory extraction function for an AI agent. Your ONLY job is to extract and return relevant information from the memories below, based on the current conversation context.
            DO NOT reply to the user, DO NOT generate a conversation, DO NOT provide advice, DO NOT ask questions, DO NOT interact with the user in any way.
            If nothing in memory is relevant, respond with an empty message.
        `;
        const instructions = `
            Consider the following information and consider the information in the conversation this far.  Is there anything in the below memories that would be important to know for a meaningful conversation?
            Current Memories:
            ${this.currentMemories}
            ---
            You must reply with a list of facts from memory.  It should be in markdown format, and a bulleted list.  Use complete sentences, indicating who, what, why, where, when, how - as appropriate.
    `;

        const messageHistory = [...info.callMessages.filter(x => !(x instanceof SystemMessage))];

        const history = messageHistory.map(m => {
            if (m instanceof AIMessage) {
                return `AI Message:\n${m.text}`;
            } else if (m instanceof HumanMessage) {
                return `Human Message:\n${m.text}`;
            }
            return '';
        }).join('\n');

        const response = await this.aiModel.invoke([
            new SystemMessage(identity),
            new SystemMessage(`Message history:\n\n${history}`), new SystemMessage(instructions),
            new SystemMessage(identity),
            new SystemMessage(instructions),
        ]);

        const aiResponse = `Memory tool function response: ${response.text}`;

        return [{ location: MessagePositionTypes.Last, message: new SystemMessage(aiResponse) }];
    }

    /** Returns the tools needed to save new memories, including property-level operations. */
    private async getMemoryTools(): Promise<(ToolNode<any> | StructuredToolInterface<ToolInputSchemaBase, any, any>)[]> {
        const params = this.specification.configuration;
        const suffix = `${params.memoryCollectionName}_${params.memoryNamespace.replaceAll('/', '__')}_${params.memoryKey}`;

        // Overwrite entire memory value
        const saveMemorySchema = {
            name: `save_memories_${suffix}`,
            description: `Replaces (or creates) the stored memory for reference ${this.memoryIdentifier}.`,
            schema: z.object({
                newValue: z.object({}).passthrough().describe(`The new memory object. This replaces the old memory value completely.`)
            })
        };
        const saveMemoryTool = tool(
            async (options: z.infer<typeof saveMemorySchema.schema>) => {
                const namespace = params.memoryNamespace.split('/');
                await this.memoryService.put(namespace, params.memoryKey, options.newValue);
            },
            saveMemorySchema
        );

        // Add or change a property
        const setPropertySchema = {
            name: `set_memory_property_${suffix}`,
            description: `Adds or updates a property in the memory object for reference ${this.memoryIdentifier}.`,
            schema: z.object({
                property: z.string().describe('The property name to add or update.'),
                value: z.any().describe('The value to set for the property.')
            })
        };
        const setPropertyTool = tool(
            async (options: z.infer<typeof setPropertySchema.schema>) => {
                const namespace = params.memoryNamespace.split('/');
                const memory = (await this.memoryService.get(namespace, params.memoryKey))?.value || {};
                memory[options.property] = options.value;
                await this.memoryService.put(namespace, params.memoryKey, memory);
            },
            setPropertySchema
        );

        // Delete a property
        const deletePropertySchema = {
            name: `delete_memory_property_${suffix}`,
            description: `Deletes a property from the memory object for reference ${this.memoryIdentifier}.`,
            schema: z.object({
                property: z.string().describe('The property name to delete.')
            })
        };
        const deletePropertyTool = tool(
            async (options: z.infer<typeof deletePropertySchema.schema>) => {
                const namespace = params.memoryNamespace.split('/');
                const memory = (await this.memoryService.get(namespace, params.memoryKey))?.value || {};
                delete memory[options.property];
                await this.memoryService.put(namespace, params.memoryKey, memory);
            },
            deletePropertySchema
        );

        return [saveMemoryTool, setPropertyTool, deletePropertyTool];
    }

    /** Contains the task runner for updating memory, so it can be completed after the chat call is done. */
    private chatCompletionTask: LongRunningTask | undefined;
    private finalMessages?: BaseMessage[];

    private async createNewMemories(finalMessages: BaseMessage[]) {
        // Get the tools for this operation.
        const tools = await this.getMemoryTools();

        tools.forEach(t => {
            t.name = t.name!.substr(0, 60);
        });

        // Get the current memory set.
        const currentMemories = this.currentMemories;

        const instructions = `
        You are an AI function to store memories for another chat agent.
        The memory reference you are working with is ${this.memoryIdentifier}.
        The previous message set is the conversation currently being conducted by the other chat agent.
        From this information, you must decide what memories to store/update.  Use the provided tools to perform your job.
        Keep topics organized for memory with subtrees.
        IMPORTANT: DO NOT REPLY TO THE MESSAGE, ONLY MAKE A TOOL CALL, OR RESPOND WITH AN EMPTY RESPONSE.
        IMPORTANT: WHen creating new memories, use COMPLETE SENTENCES for the information.
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

    async chatComplete(finalMessages: BaseMessage[], newMessages: BaseMessage[]): Promise<void> {
        // Copy the final messages for later use.
        this.finalMessages = copyBaseMessages(finalMessages);
    }

    override getLongRunningTasks(): LongRunningTask[] {
        // We must do this here, and NOT in the chatComplete call, because that's part of the LangGraph,
        //  and when the graph completes, it will cancel any LLMs running under that context.
        const memoryPromise = this.createNewMemories(this.finalMessages!);

        // Create the long running task.
        this.chatCompletionTask = new LongRunningTask('Create New Memories', memoryPromise, 60000);

        // Return the task.
        return [this.chatCompletionTask];
    }

    async initialize(): Promise<void> {
        this.currentMemories = await this.getCurrentMemories();
    }
}
