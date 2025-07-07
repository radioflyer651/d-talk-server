
export const ROOM_INFO_PLUGIN_TYPE_ID = 'room-info-plugin';

export interface PluginInfo {
    pluginType: string;
    attachesToChatRoom: boolean;
    attachesToAgent: boolean;
    attachesToJob: boolean;
    /** When implemented, returns a value that can be used for configuring this type of plugin. */
    defaultParameterCreator: () => any;
}

/** Contains the information about what specific plugins can be attached to. (This is more used in the UI than the server.) */
export const pluginInformation: PluginInfo[] = [
    {
        pluginType: ROOM_INFO_PLUGIN_TYPE_ID,
        attachesToAgent: true,
        attachesToChatRoom: true,
        attachesToJob: true,
        defaultParameterCreator: () => undefined
    }
];