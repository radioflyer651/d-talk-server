import { IPluginTypeResolver } from "./chat-core/agent-plugin/i-plugin-type-resolver";
import { ActDrunkPluginResolver } from "./chat-core/plugin-implementations/plugin-resolver-services/act-drunk.plugin-resolver";
import { DebugPluginResolver } from "./chat-core/plugin-implementations/plugin-resolver-services/dbug.plugin-resolver";
import { OtherAgentMessagesAsUserPluginResolver } from "./chat-core/plugin-implementations/plugin-resolver-services/other-agent-messages-as-user.plugin-resolver";
import { OtherAgentsInvisiblePluginResolver } from "./chat-core/plugin-implementations/plugin-resolver-services/other-agents-invisible.plugin-resolver";
import { RoomInfoPluginResolver } from "./chat-core/plugin-implementations/plugin-resolver-services/room-info.plugin-resolver";
import { UserMessagesIgnoredPluginResolver } from "./chat-core/plugin-implementations/plugin-resolver-services/user-messages-ignored.plugin-resolver";
import { LabelAgentSpeakersPluginResolver } from "./chat-core/plugin-implementations/plugin-resolver-services/label-agent-speakers-plugin-resolver";
import { IgnoreSpecificAgentPluginResolver } from "./chat-core/plugin-implementations/plugin-resolver-services/ignore-specific-agent-plugin-resolver";
import { WebSearchPluginResolver } from "./chat-core/plugin-implementations/plugin-resolver-services/web-search.plugin-resolver";
import { LabeledMemoryPluginResolver } from "./chat-core/plugin-implementations/plugin-resolver-services/labeled-memory-plugin-resolver";
import { IAppConfig } from "./model/app-config.model";


export let pluginTypeResolvers: IPluginTypeResolver<any>[] = [];

export async function initializePluginTypeResolvers(config: IAppConfig) {
    pluginTypeResolvers.push(...[
        new RoomInfoPluginResolver(),
        new ActDrunkPluginResolver(),
        new OtherAgentsInvisiblePluginResolver(),
        new DebugPluginResolver(),
        new OtherAgentMessagesAsUserPluginResolver(),
        new UserMessagesIgnoredPluginResolver(),
        new LabelAgentSpeakersPluginResolver(),
        new IgnoreSpecificAgentPluginResolver(),
        new WebSearchPluginResolver(config.tavilyConfiguration.apiKey),
        new LabeledMemoryPluginResolver(),
    ]);
}