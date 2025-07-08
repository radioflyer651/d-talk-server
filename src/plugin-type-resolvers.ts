import { IPluginTypeResolver } from "./chat-core/agent-plugin/i-plugin-type-resolver";
import { ActDrunkPluginResolver } from "./chat-core/plugin-implementations/plugin-resolver-services/act-drunk.plugin-resolver";
import { DebugPluginResolver } from "./chat-core/plugin-implementations/plugin-resolver-services/dbug.plugin-resolver";
import { OtherAgentMessagesAsUserPluginResolver } from "./chat-core/plugin-implementations/plugin-resolver-services/other-agent-messages-as-user.plugin-resolver";
import { OtherAgentsInvisiblePluginResolver } from "./chat-core/plugin-implementations/plugin-resolver-services/other-agents-invisible.plugin-resolver";
import { RoomInfoPluginResolver } from "./chat-core/plugin-implementations/plugin-resolver-services/room-info.plugin-resolver";
import { UserMessagesIgnoredPluginResolver } from "./chat-core/plugin-implementations/plugin-resolver-services/user-messages-ignored.plugin-resolver";


export const pluginTypeResolvers: IPluginTypeResolver<any>[] = [
    new RoomInfoPluginResolver(),
    new ActDrunkPluginResolver(),
    new OtherAgentsInvisiblePluginResolver(),
    new DebugPluginResolver(),
    new OtherAgentMessagesAsUserPluginResolver(),
    new UserMessagesIgnoredPluginResolver(),
];