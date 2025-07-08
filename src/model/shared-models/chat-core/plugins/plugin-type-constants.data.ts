
export const ROOM_INFO_PLUGIN_TYPE_ID = 'room-info-plugin';
export const ACT_DRUNK = 'act-drunk';

export interface PluginInfo {
    pluginType: string;
    displayName: string;
    description?: string;
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
        displayName: `Knows Room Agents`,
        attachesToAgent: true,
        attachesToChatRoom: true,
        attachesToJob: true,
        defaultParameterCreator: () => undefined
    },
    {
        pluginType: ACT_DRUNK,
        displayName: 'Agent Acts Drunk',
        attachesToAgent: true,
        attachesToChatRoom: true,
        attachesToJob: true,
        description: 'The agent will ack drunk',
        defaultParameterCreator: () => ({ message: 'You will act hammered.' })
    }
];