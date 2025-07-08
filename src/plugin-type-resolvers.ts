import { IPluginTypeResolver } from "./chat-core/agent-plugin/i-plugin-type-resolver";
import { RoomInfoPluginResolver } from "./chat-core/plugin-implementations/plugin-resolver-services/room-info.plugin-resolver";
import { RoomInfoPlugin } from "./chat-core/plugin-implementations/plugins/room-info.plugin";


export const pluginTypeResolvers: IPluginTypeResolver<any>[] = [
    new RoomInfoPluginResolver()
];