export const ROOM_INFO_PLUGIN_TYPE_ID = 'room-info-plugin';
export const OTHER_AGENTS_INVISIBLE_PLUGIN = 'other-agents-invisible';
export const DEBUG_PLUGIN = 'debug';
export const ACT_DRUNK = 'act-drunk';
export const OTHER_AGENT_MESSAGES_AS_USER = 'other-agent-messages-as-user';
export const THIS_AGENT_MESSAGE_AS_USER = 'this-agent-messages-as-user';
export const USER_MESSAGES_IGNORED_PLUGIN_TYPE_ID = 'user-messages-ignored';
export const LABEL_AGENT_SPEAKERS_PLUGIN_TYPE_ID = 'label-agent-speakers';
export const IGNORE_SPECIFIC_AGENT_PLUGIN_TYPE_ID = 'ignore-specific-agent';

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
        pluginType: OTHER_AGENT_MESSAGES_AS_USER,
        displayName: 'Convert Other Agent Messages To User Messages',
        attachesToAgent: true,
        attachesToChatRoom: true,
        attachesToJob: true,
        description: `When the agent is responding to an LLM message, all other agent messages will appear as user messages instead of agent/ai messages.`,
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
    {
        pluginType: USER_MESSAGES_IGNORED_PLUGIN_TYPE_ID,
        displayName: 'Ignore User Messages',
        attachesToAgent: true,
        attachesToChatRoom: true,
        attachesToJob: true,
        description: 'Causes the agent to ignore user messages when responding to chat.',
        defaultParameterCreator: () => undefined,
    },
    {
        pluginType: LABEL_AGENT_SPEAKERS_PLUGIN_TYPE_ID,
        displayName: 'Label Agent Speakers',
        attachesToAgent: true,
        attachesToChatRoom: true,
        attachesToJob: true,
        description: 'Labels the agents that are speaking in the chat.',
        defaultParameterCreator: () => undefined,
    },
    {
        pluginType: IGNORE_SPECIFIC_AGENT_PLUGIN_TYPE_ID,
        displayName: 'Ignore Specific Agent',
        attachesToAgent: true,
        attachesToChatRoom: true,
        attachesToJob: true,
        description: 'Causes the agent to ignore messages from specific agents.',
        defaultParameterCreator: () => ({ agentIds: [] }),
    },
];