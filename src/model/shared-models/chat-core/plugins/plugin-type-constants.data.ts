import { createChatDirectoryPermissions } from "../documents/chat-document-permissions.model";
import { CreateTextDocumentsPluginParams } from "./create-text-documents-plugin.params";
import { InnerVoicePluginParams } from "./inner-voice-plugin.params";
import { LabeledMemoryPluginParams } from "./labeled-memory-plugin.params";
import { LabeledMemory2PluginParams } from "./labeled-memory-plugin2.params";

export const ROOM_INFO_PLUGIN_TYPE_ID = 'room-info-plugin';
export const INNER_VOICE_PLUGIN_TYPE_ID = 'inner-voice-plugin';
export const OTHER_AGENTS_INVISIBLE_PLUGIN = 'other-agents-invisible';
export const DEBUG_PLUGIN = 'debug';
export const ACT_DRUNK = 'act-drunk';
export const OTHER_AGENT_MESSAGES_AS_USER = 'other-agent-messages-as-user';
export const THIS_AGENT_MESSAGE_AS_USER = 'this-agent-messages-as-user';
export const USER_MESSAGES_IGNORED_PLUGIN_TYPE_ID = 'user-messages-ignored';
export const LABEL_AGENT_SPEAKERS_PLUGIN_TYPE_ID = 'label-agent-speakers';
export const IGNORE_SPECIFIC_AGENT_PLUGIN_TYPE_ID = 'ignore-specific-agent';
export const WEB_SEARCH_PLUGIN_TYPE_ID = 'web-search-plugin';
export const LABELED_MEMORY_PLUGIN_TYPE_ID = 'labeled-memory-plugin';
export const LABELED_MEMORY2_PLUGIN_TYPE_ID = 'labeled-memory2-plugin';
export const CREATE_TEXT_DOCUMENTS_PLUGIN_TYPE_ID = 'create-text-documents-plugin';
export const RANDOM_CHOICE_PLUGIN_TYPE_ID = 'random-choice-plugin';
export const MANAGE_DOCUMENT_FOLDER_PLUGIN_TYPE_ID = 'manage-document-folder';
export const CURRENT_TIME_AND_DATE_PLUGIN_TYPE_ID = 'current-time-and-date-plugin';

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
        pluginType: INNER_VOICE_PLUGIN_TYPE_ID,
        displayName: 'Inner Voice',
        description: 'Provides an inner monologue for the agent, visible only to itself.',
        attachesToAgent: true,
        attachesToChatRoom: true,
        attachesToJob: true,
        defaultParameterCreator: () => (<InnerVoicePluginParams>{
            messageList: [],
            callType: 'system',
            considerLastMessageInResponse: true,
            responseToLastInnerVoiceMessage: true,
            addDummyAiMessageBeforeInnerDialog: false,

            excludeChatRoomMessages: false,
            excludeJobMessages: false,
            excludeAgentIdentityMessages: false,
            excludeAgentInstructionMessages: false,
            excludePluginMessages: false,
            excludeProjectMessages: false,
        })
    },
    {
        pluginType: ACT_DRUNK,
        displayName: 'Act Drunk',
        attachesToAgent: true,
        attachesToChatRoom: true,
        attachesToJob: true,
        description: 'The agent will act drunk',
        defaultParameterCreator: () => ({ message: 'You will act hammered.' })
    },
    {
        pluginType: OTHER_AGENTS_INVISIBLE_PLUGIN,
        displayName: 'Other Agents Invisible',
        attachesToAgent: true,
        attachesToChatRoom: true,
        attachesToJob: true,
        description: 'When agents respond, they will not see messages from other agents in the room.',
        defaultParameterCreator: () => undefined,
    },
    {
        pluginType: OTHER_AGENT_MESSAGES_AS_USER,
        displayName: 'Convert Agents To Users',
        attachesToAgent: true,
        attachesToChatRoom: true,
        attachesToJob: true,
        description: `When the agent is responding to an LLM message, all other agent messages will appear as user messages instead of agent/ai messages.`,
        defaultParameterCreator: () => undefined,
    },
    {
        pluginType: DEBUG_PLUGIN,
        displayName: 'Debug Messages',
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
    {
        pluginType: WEB_SEARCH_PLUGIN_TYPE_ID,
        displayName: 'Web Search',
        description: 'Allows agents to perform web searches and return results.',
        attachesToAgent: true,
        attachesToChatRoom: true,
        attachesToJob: true,
        defaultParameterCreator: () => ({})
    },
    {
        pluginType: LABELED_MEMORY_PLUGIN_TYPE_ID,
        displayName: 'Labeled Memory',
        description: 'Allows agents to have labeled memory for better context in conversations.',
        attachesToAgent: true,
        attachesToChatRoom: true,
        attachesToJob: true,
        defaultParameterCreator: () => (<LabeledMemoryPluginParams>{
            memoryCollectionName: 'memories',
            memoryKeyPrefix: [],
            memorySetPurpose: 'To remember information about ...',
            projectId: undefined as any, // This has to be filled in by the editor.
            modelServiceParams: {
                llmService: '',
                serviceParams: undefined as any, // This has to be filled in by the editor.
            },
            keyMeanings: [],
            canWrite: true,
        })
    },
    {
        pluginType: LABELED_MEMORY2_PLUGIN_TYPE_ID,
        displayName: 'Labeled Memory 2',
        description: '(IMPROVED) Allows agents to have labeled memory for better context in conversations.',
        attachesToAgent: true,
        attachesToChatRoom: true,
        attachesToJob: true,
        defaultParameterCreator: () => (<LabeledMemory2PluginParams>{
            memoryCollectionName: 'memories',
            memoryKey: '',
            memoryNamespace: '',
            memorySetInstructions: 'To remember information about ...',
            projectId: undefined as any, // This has to be filled in by the editor.
            modelServiceParams: {
                llmService: '',
                serviceParams: undefined as any, // This has to be filled in by the editor.
            },
            canWrite: true,
            placeFullMemoryIntoContext: true,
        })
    },
    {
        pluginType: CREATE_TEXT_DOCUMENTS_PLUGIN_TYPE_ID,
        displayName: 'Create Text Documents',
        description: 'Allows agents to create text documents as part of the chat process.',
        attachesToAgent: true,
        attachesToChatRoom: true,
        attachesToJob: true,
        defaultParameterCreator: () => <CreateTextDocumentsPluginParams>{
            canCreateSubfolders: true,
            instructions: '',
            rootFolder: '',
        }
    },
    {
        pluginType: RANDOM_CHOICE_PLUGIN_TYPE_ID,
        displayName: `Random Choice`,
        description: `Allows the LLM to have a set of values, and this plugin will choose random items from the list.`,
        attachesToAgent: true,
        attachesToChatRoom: true,
        attachesToJob: true,
        defaultParameterCreator: () => undefined,
    },
    {
        pluginType: MANAGE_DOCUMENT_FOLDER_PLUGIN_TYPE_ID,
        displayName: 'Manage Document Folder',
        description: 'Allows agents to manage document folders, including creating and organizing folders.',
        attachesToAgent: true,
        attachesToChatRoom: true,
        attachesToJob: true,
        defaultParameterCreator: () => createChatDirectoryPermissions()
    },
    {
        pluginType: CURRENT_TIME_AND_DATE_PLUGIN_TYPE_ID,
        displayName: 'Current Time Date',
        description: 'Adds the current time and date to the message list.',
        attachesToAgent: true,
        attachesToChatRoom: true,
        attachesToJob: true,
        defaultParameterCreator: () => ({})
    },
];