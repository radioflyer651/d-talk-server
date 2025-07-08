import { BaseMessage } from "@langchain/core/messages";
import { AgentPluginBase } from "../../agent-plugin/agent-plugin-base.service";
import { DEBUG_PLUGIN } from "../../../model/shared-models/chat-core/plugins/plugin-type-constants.data";
import { PluginInstanceReference } from "../../../model/shared-models/chat-core/plugin-instance-reference.model";
import { PluginSpecification } from "../../../model/shared-models/chat-core/plugin-specification.model";

export class DebugPlugin extends AgentPluginBase {
    readonly type: string = DEBUG_PLUGIN;
    agentUserManual?: string | undefined;

    constructor(params: PluginInstanceReference<undefined> | PluginSpecification<undefined>) {
        super(params);
    }

    priority: number = 5;

    /**
     * Called at the end of the chat session, allowing the contributor to finalize or clean up resources.
     */
    async chatComplete?(finalMessages: BaseMessage[], newMessages: BaseMessage[]): Promise<void> {
        console.log(`(chatComplete) Final Messages`);
        console.log(finalMessages);
    }

    async inspectChatCallMessages(callMessages: BaseMessage[], chatHistory: BaseMessage[]): Promise<void> {
        console.log(`inspectChatCallMessages`);

        console.log(callMessages);
        console.log(chatHistory);
    }
}