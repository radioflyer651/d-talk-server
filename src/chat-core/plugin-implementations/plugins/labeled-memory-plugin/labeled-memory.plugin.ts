import { AgentPluginBase } from "../../../agent-plugin/agent-plugin-base.service";
import { IChatLifetimeContributor } from "../../../chat-lifetime-contributor.interface";
import { LABELED_MEMORY_PLUGIN_TYPE_ID } from "../../../../model/shared-models/chat-core/plugins/plugin-type-constants.data";
import { PluginInstanceReference } from "../../../../model/shared-models/chat-core/plugin-instance-reference.model";
import { PluginSpecification } from "../../../../model/shared-models/chat-core/plugin-specification.model";
import { LabeledMemoryPluginParams } from "../../../../model/shared-models/chat-core/plugins/labeled-memory-plugin.params";
import { MongoDbStore } from "../../../../services/lang-chain/mongo-store.service";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";

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

    
}
