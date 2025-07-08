import { IPluginTypeResolver } from "./chat-core/agent-plugin/i-plugin-type-resolver";
import { ActDrunkPluginResolver } from "./chat-core/plugin-implementations/plugin-resolver-services/act-drunk.plugin-resolver";
import { RoomInfoPluginResolver } from "./chat-core/plugin-implementations/plugin-resolver-services/room-info.plugin-resolver";


export const pluginTypeResolvers: IPluginTypeResolver<any>[] = [
    new RoomInfoPluginResolver(),
    new ActDrunkPluginResolver(),
];