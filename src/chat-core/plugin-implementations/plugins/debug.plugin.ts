import { AIMessage, BaseMessage } from "@langchain/core/messages";
import { AgentPluginBase } from "../../agent-plugin/agent-plugin-base.service";
import { DEBUG_PLUGIN } from "../../../model/shared-models/chat-core/plugins/plugin-type-constants.data";
import { PluginInstanceReference } from "../../../model/shared-models/chat-core/plugin-instance-reference.model";
import { PluginSpecification } from "../../../model/shared-models/chat-core/plugin-specification.model";
import { LifetimeContributorPriorityTypes } from "../../lifetime-contributor-priorities.enum";

const DIVIDER = '─'.repeat(80);
const THIN    = '·'.repeat(80);

function roleLabel(msg: BaseMessage): string {
    const type = msg.getType();
    switch (type) {
        case 'human':   return 'USER';
        case 'ai':      return 'AI';
        case 'system':  return 'SYSTEM';
        case 'tool':    return 'TOOL';
        default:        return type.toUpperCase();
    }
}

function formatContent(msg: BaseMessage): string {
    const raw = typeof msg.content === 'string'
        ? msg.content
        : JSON.stringify(msg.content, null, 2);
    return raw.trim() || '(empty)';
}

function formatMessage(msg: BaseMessage, index: number): string {
    const role    = roleLabel(msg);
    const name    = (msg as any).name ? ` [${(msg as any).name}]` : '';
    const source  = (msg.additional_kwargs as any)?.source ? ` <src:${(msg.additional_kwargs as any).source}>` : '';
    const toolCalls = msg instanceof AIMessage && (msg as any).tool_calls?.length
        ? `\n  tool_calls: ${JSON.stringify((msg as any).tool_calls)}`
        : '';

    const header  = `  [${index}] ${role}${name}${source}${toolCalls}`;
    const content = formatContent(msg)
        .split('\n')
        .map(l => `    ${l}`)
        .join('\n');

    return `${header}\n${content}`;
}

function printMessages(label: string, messages: BaseMessage[]): void {
    console.log(DIVIDER);
    console.log(`  ${label}  (${messages.length} message${messages.length !== 1 ? 's' : ''})`);
    console.log(DIVIDER);
    if (messages.length === 0) {
        console.log('  (none)');
    } else {
        messages.forEach((m, i) => {
            console.log(formatMessage(m, i));
            if (i < messages.length - 1) console.log(THIN);
        });
    }
    console.log(DIVIDER);
}

export class DebugPlugin extends AgentPluginBase {
    readonly type: string = DEBUG_PLUGIN;
    agentUserManual?: string | undefined;

    constructor(params: PluginInstanceReference<undefined> | PluginSpecification<undefined>) {
        super(params);
    }

    priority: LifetimeContributorPriorityTypes = LifetimeContributorPriorityTypes.Last;

    async inspectChatCallMessages(callMessages: BaseMessage[], chatHistory: BaseMessage[]): Promise<void> {
        process.stdout.write('[DebugPlugin] inspectChatCallMessages fired\n');
        const agentName = this.agent?.myName ?? '(unknown)';
        const jobName   = this.chatJob?.myName ?? '(unknown)';

        console.log(`\n${'═'.repeat(80)}`);
        console.log(`  DEBUG — PRE-CHAT CONTEXT`);
        console.log(`  Agent: ${agentName}   Job: ${jobName}`);
        console.log(`${'═'.repeat(80)}`);

        printMessages('CALL MESSAGES  (sent to LLM)', callMessages);
        printMessages('MESSAGE HISTORY  (full room history)', chatHistory);

        console.log(`${'═'.repeat(80)}\n`);
    }

    async chatComplete(finalMessages: BaseMessage[], newMessages: BaseMessage[]): Promise<void> {
        const agentName = this.agent?.myName ?? '(unknown)';

        console.log(`\n${'═'.repeat(80)}`);
        console.log(`  DEBUG — CHAT COMPLETE`);
        console.log(`  Agent: ${agentName}   new messages: ${newMessages.length}`);
        console.log(`${'═'.repeat(80)}`);

        printMessages('NEW MESSAGES', newMessages);

        console.log(`${'═'.repeat(80)}\n`);
    }
}
