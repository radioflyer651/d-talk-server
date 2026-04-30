export interface SubAgentPluginConfiguration {
    /** ObjectId strings of agent identities this agent is permitted to spawn. Empty = none allowed. */
    allowedAgentIdentityIds: string[];
    /** Maximum nesting depth. Default: 3. */
    maxSpawnDepth: number;
    /** Delete the ephemeral sub-room after completion. Default: true. */
    deleteRoomOnCompletion: boolean;
    /** Prepend recent parent messages as context in the sub-agent's task. Default: false. */
    passContextToSubAgent: boolean;
    /** Number of recent parent messages to include when passContextToSubAgent is true. Default: 10. */
    contextMessageCount: number;
    /** Name prefix for spawned sub-rooms. Default: 'sub-room'. */
    subRoomNamePrefix: string;
    /** Milliseconds before aborting the sub-agent call. Default: 120000. */
    timeoutMs: number;
}

export interface SubAgentResult {
    success: boolean;
    subRoomId: string;
    agentIdentityId: string;
    agentName: string;
    responseMessages: Array<{ role: 'ai' | 'tool'; content: string; name?: string }>;
    /** The final AI message text from the sub-agent. */
    finalResponse: string;
    errorMessage?: string;
}
