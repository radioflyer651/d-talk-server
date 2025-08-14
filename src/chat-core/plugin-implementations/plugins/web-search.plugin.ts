import { IChatLifetimeContributor } from "../../chat-lifetime-contributor.interface";
import { WEB_SEARCH_PLUGIN_TYPE_ID } from "../../../model/shared-models/chat-core/plugins/plugin-type-constants.data";
import { DynamicTool, StructuredToolInterface, Tool } from "@langchain/core/tools";
import { TavilySearch } from '@langchain/tavily';
import { AgentPluginBase } from "../../agent-plugin/agent-plugin-base.service";
import { PluginSpecification } from "../../../model/shared-models/chat-core/plugin-specification.model";
import { WebSearchPluginParams } from "../../../model/shared-models/chat-core/plugins/web-search-plugin.params";
import { PluginInstanceReference } from "../../../model/shared-models/chat-core/plugin-instance-reference.model";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { LifetimeContributorPriorityTypes } from "../../lifetime-contributor-priorities.enum";

export class WebSearchPlugin extends AgentPluginBase implements IChatLifetimeContributor {
    constructor(
        params: PluginInstanceReference<WebSearchPluginParams> | PluginSpecification<WebSearchPluginParams>,
        private readonly tavilyApiKey: string
    ) {
        super(params);
    }
    agentUserManual?: string | undefined;
    readonly type = WEB_SEARCH_PLUGIN_TYPE_ID;

    priority: LifetimeContributorPriorityTypes = LifetimeContributorPriorityTypes.Normal;

    async getTools(): Promise<(ToolNode | StructuredToolInterface)[]> {
        return [new TavilySearch({ maxResults: 20, tavilyApiKey: this.tavilyApiKey })] as (ToolNode | StructuredToolInterface)[];
    }
}
