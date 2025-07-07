
export type StoredMessageAgentTypes = 'human' | 'system' | 'ai' | 'none';

export const storedMessageAgentTypeOptions = [
    {
        label: 'User',
        value: 'human',
    },
    {
        label: 'System',
        value: 'system',
    },
    {
        label: 'Agent',
        value: 'ai',
    },
    {
        label: 'None',
        value: 'none',
    }
];