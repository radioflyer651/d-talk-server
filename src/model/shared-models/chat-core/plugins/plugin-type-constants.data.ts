
export const ROOM_INFO_PLUGIN_TYPE_ID = 'room-info-plugin';
export const OTHER_AGENTS_INVISIBLE_PLUGIN = 'other-agents-invisible';
export const DEBUG_PLUGIN = 'debug';
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
        description: 'The agent will act drunk',
        defaultParameterCreator: () => ({ message: 'You will act hammered.' })
    },
    {
        pluginType: OTHER_AGENTS_INVISIBLE_PLUGIN,
        displayName: 'Other Agents Are Invisible',
        attachesToAgent: true,
        attachesToChatRoom: true,
        attachesToJob: true,
        description: 'When agents respond, they will not see messages from other agents in the room.',
        defaultParameterCreator: () => undefined,
    },
    {
        pluginType: DEBUG_PLUGIN,
        displayName: 'Allows arbitrary debugging of agents in the chat process.',
        attachesToAgent: true,
        attachesToChatRoom: false,
        attachesToJob: true,
        defaultParameterCreator: () => undefined,
    },
];