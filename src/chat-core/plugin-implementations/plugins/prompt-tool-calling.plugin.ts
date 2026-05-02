import { AgentPluginBase } from '../../agent-plugin/agent-plugin-base.service';
import { PluginInstanceReference } from '../../../model/shared-models/chat-core/plugin-instance-reference.model';
import { PluginSpecification } from '../../../model/shared-models/chat-core/plugin-specification.model';
import { PROMPT_TOOL_CALLING_PLUGIN_TYPE_ID } from '../../../model/shared-models/chat-core/plugins/plugin-type-constants.data';
import { PromptToolCallingPluginConfiguration } from '../../../model/shared-models/chat-core/plugins/prompt-tool-calling-plugin.params';
import { AIMessage, BaseMessage, HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import { PositionableMessage, MessagePositionTypes } from '../../../model/shared-models/chat-core/positionable-message.model';
import { StructuredToolInterface } from '@langchain/core/tools';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { ChatCallInfo } from '../../chat-lifetime-contributor.interface';
import { ObjectId } from 'mongodb';

export class PromptToolCallingPlugin extends AgentPluginBase {
    constructor(params: PluginInstanceReference | PluginSpecification) {
        super(params);
    }

    readonly type = PROMPT_TOOL_CALLING_PLUGIN_TYPE_ID;
    readonly agentUserManual = 'This plugin enables tool calling via injected prompts for models that do not support native function calling.';

    private _cachedTools: StructuredToolInterface[] = [];
    private _retryCount = 0;

    private get config(): PromptToolCallingPluginConfiguration {
        return this.specification?.configuration ?? {
            toolCallOpenTag: '<tool_call>',
            toolCallCloseTag: '</tool_call>',
            maxRetries: 2,
            includeExamples: true,
        };
    }

    async initialize(): Promise<void> {
        this._retryCount = 0;
    }

    // Signals the chatCall node to skip bindTools so the LLM receives plain text only.
    readonly suppressNativeToolBinding = true;

    async modifyTools(tools: (ToolNode | StructuredToolInterface)[]): Promise<(ToolNode | StructuredToolInterface)[]> {
        // Cache the full resolved tool list for schema injection and tool execution.
        this._cachedTools = tools.filter(
            (t): t is StructuredToolInterface =>
                !!t && typeof (t as StructuredToolInterface).invoke === 'function' && typeof (t as StructuredToolInterface).name === 'string'
        );

        // Return tools unchanged — state.tools must stay populated for callTools to execute them.
        return tools;
    }

    async addPreChatMessages(info: ChatCallInfo): Promise<PositionableMessage<BaseMessage>[]> {
        if (this._cachedTools.length === 0) {
            return [];
        }

        const cfg = this.config;
        const schema = this._buildToolSchema();
        const example = cfg.includeExamples ? this._buildExample() : '';

        const lines = [
            'You have access to the following tools. To call a tool, respond ONLY with a tool call block in this exact format and nothing else:',
            '',
            `${cfg.toolCallOpenTag}`,
            `{"name": "tool_name", "args": {"param1": "value1"}}`,
            `${cfg.toolCallCloseTag}`,
            '',
            'If you do not need to call a tool, respond normally without the tool call block.',
            '',
            'Available tools:',
            schema,
        ];

        if (example) {
            lines.push('', example);
        }

        const message = new SystemMessage(lines.join('\n'));

        return [{
            location: MessagePositionTypes.AfterInstructions,
            message,
        }];
    }

    async handleReply(reply: AIMessage): Promise<undefined | PositionableMessage<BaseMessage>[]> {
        const content = typeof reply.content === 'string' ? reply.content : '';
        if (!content) {
            return undefined;
        }

        const cfg = this.config;
        const openTag = cfg.toolCallOpenTag;
        const closeTag = cfg.toolCallCloseTag;

        const openIdx = content.indexOf(openTag);
        const closeIdx = content.indexOf(closeTag);

        if (openIdx === -1) {
            // No tool call in this reply — normal response.
            return undefined;
        }

        if (closeIdx === -1 || closeIdx <= openIdx) {
            return this._handleParseError(reply, 'Closing tag not found or appears before opening tag.');
        }

        const jsonText = content.slice(openIdx + openTag.length, closeIdx).trim();

        let parsed: { name: string; args: Record<string, unknown> };
        try {
            parsed = JSON.parse(jsonText);
        } catch {
            return this._handleParseError(reply, `Could not parse tool call JSON: ${jsonText}`);
        }

        if (!parsed.name || typeof parsed.name !== 'string') {
            return this._handleParseError(reply, 'Tool call JSON is missing the "name" field.');
        }

        const tool = this._cachedTools.find(t => t.name === parsed.name);
        if (!tool) {
            return this._handleParseError(reply, `Unknown tool "${parsed.name}". Available tools: ${this._cachedTools.map(t => t.name).join(', ')}`);
        }

        // Synthesize a tool_calls entry so the existing callTools node handles execution.
        const callId = new ObjectId().toHexString();
        (reply as any).tool_calls = [{
            name: parsed.name,
            args: parsed.args ?? {},
            id: callId,
            type: 'tool_call',
        }];

        this._retryCount = 0;
        console.log(`[PromptToolCallingPlugin] Tool call parsed | tool="${parsed.name}" id=${callId}`);

        return undefined;
    }

    async peekToolCallMessages(
        messageHistory: BaseMessage[],
        callMessages: BaseMessage[],
        newMessages: BaseMessage[],
    ): Promise<void> {
        // Find ToolMessages that were just added (present in newMessages).
        const newToolMessages = newMessages.filter((m): m is ToolMessage => m.getType() === 'tool');
        if (newToolMessages.length === 0) {
            return;
        }

        const cfg = this.config;

        for (const toolMsg of newToolMessages) {
            const toolName = this._getToolNameForResult(messageHistory, toolMsg);
            const resultContent = typeof toolMsg.content === 'string' ? toolMsg.content : JSON.stringify(toolMsg.content);

            const humanText = [
                `Tool result${toolName ? ` for "${toolName}"` : ''}:`,
                resultContent,
                '',
                'Continue your response based on this result. If you need to call another tool, use the tool call format. Otherwise, provide your final response.',
            ].join('\n');

            const humanMsg = new HumanMessage(humanText);

            // Replace the ToolMessage in callMessages with the human-readable version.
            const idx = callMessages.indexOf(toolMsg);
            if (idx >= 0) {
                callMessages.splice(idx, 1, humanMsg);
            } else {
                callMessages.push(humanMsg);
            }

            console.log(`[PromptToolCallingPlugin] Tool result converted to HumanMessage | tool="${toolName ?? '?'}" length=${resultContent.length}`);
        }

        // Also neutralize the synthesized tool_calls on the preceding AIMessage in callMessages
        // so the model doesn't see a confusing partially-native structure.
        for (let i = callMessages.length - 1; i >= 0; i--) {
            const msg = callMessages[i];
            if (msg instanceof AIMessage && (msg as any).tool_calls?.length > 0) {
                // Strip the tool_calls — the raw XML text in content is sufficient context.
                (msg as any).tool_calls = [];
                break;
            }
        }
    }

    async chatComplete(): Promise<void> {
        this._cachedTools = [];
        this._retryCount = 0;
    }

    // -------------------------------------------------------------------------

    private _buildToolSchema(): string {
        return this._cachedTools.map(t => {
            const schema = (t as any).schema ?? (t as any).lc_kwargs?.schema;
            let paramDesc = '';
            if (schema?.shape) {
                const params = Object.entries(schema.shape as Record<string, any>)
                    .map(([key, def]) => {
                        const desc = def._def?.description ?? '';
                        const typeName = def._def?.typeName ?? 'any';
                        return `  - ${key} (${typeName})${desc ? ': ' + desc : ''}`;
                    })
                    .join('\n');
                paramDesc = params ? `\n${params}` : '';
            }
            return `${t.name}: ${t.description ?? '(no description)'}${paramDesc}`;
        }).join('\n\n');
    }

    private _buildExample(): string {
        const first = this._cachedTools[0];
        if (!first) return '';
        const cfg = this.config;
        return [
            'Example:',
            cfg.toolCallOpenTag,
            `{"name": "${first.name}", "args": {}}`,
            cfg.toolCallCloseTag,
        ].join('\n');
    }

    private _handleParseError(reply: AIMessage, reason: string): PositionableMessage<BaseMessage>[] | undefined {
        console.warn(`[PromptToolCallingPlugin] Parse error | reason="${reason}"`);

        if (this._retryCount >= this.config.maxRetries) {
            console.warn(`[PromptToolCallingPlugin] Max retries (${this.config.maxRetries}) reached — giving up on tool call parsing.`);
            return undefined;
        }

        this._retryCount++;

        const cfg = this.config;
        const retryMessage = new HumanMessage(
            `Your previous response contained a malformed tool call. ${reason}\n\n` +
            `Please try again using exactly this format:\n` +
            `${cfg.toolCallOpenTag}\n{"name": "tool_name", "args": {"param1": "value1"}}\n${cfg.toolCallCloseTag}`
        );

        return [{
            location: MessagePositionTypes.Last,
            message: retryMessage,
        }];
    }

    private _getToolNameForResult(messageHistory: BaseMessage[], toolMsg: ToolMessage): string | undefined {
        // Walk backwards to find the AIMessage with tool_calls that matches this ToolMessage's tool_call_id.
        for (let i = messageHistory.length - 1; i >= 0; i--) {
            const msg = messageHistory[i];
            if (msg instanceof AIMessage) {
                const calls: any[] = (msg as any).tool_calls ?? [];
                const match = calls.find(c => c.id === toolMsg.tool_call_id);
                if (match) {
                    return match.name as string;
                }
            }
        }
        return undefined;
    }
}
