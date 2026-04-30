import { AgentPluginBase, PluginAttachmentTarget } from '../../agent-plugin/agent-plugin-base.service';
import { PluginInstanceReference } from '../../../model/shared-models/chat-core/plugin-instance-reference.model';
import { PluginSpecification } from '../../../model/shared-models/chat-core/plugin-specification.model';
import { SUB_AGENT_PLUGIN_TYPE_ID } from '../../../model/shared-models/chat-core/plugins/plugin-type-constants.data';
import { SubAgentPluginConfiguration, SubAgentResult } from '../../../model/shared-models/chat-core/plugins/sub-agent-plugin.params';
import { ChattingService } from '../../chatting/chatting.service';
import { ChatRoomDbService } from '../../../database/chat-core/chat-room-db.service';
import { AgentDbService } from '../../../database/chat-core/agent-db.service';
import { AgentInstanceDbService } from '../../../database/chat-core/agent-instance-db.service';
import { ChatCoreService } from '../../../services/chat-core.service';
import { AuthDbService } from '../../../database/auth-db.service';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { tool } from '@langchain/core/tools';
import { AIMessage } from '@langchain/core/messages';

/** Tracks spawn depth per parent room to prevent infinite loops. */
const activeSpawnDepths = new Map<string, number>();

export class SubAgentPlugin extends AgentPluginBase {
    constructor(
        params: PluginInstanceReference | PluginSpecification,
        private readonly chattingServiceProvider: () => ChattingService,
        private readonly chatRoomDbService: ChatRoomDbService,
        private readonly agentDbService: AgentDbService,
        private readonly agentInstanceDbService: AgentInstanceDbService,
        private readonly chatCoreService: ChatCoreService,
        private readonly authDbService: AuthDbService,
    ) {
        super(params);
    }

    readonly type = SUB_AGENT_PLUGIN_TYPE_ID;
    readonly agentUserManual = 'Use the spawn_subagent tool to delegate a task to another agent. The sub-agent runs in its own ephemeral room and returns a structured result.';

    getTools() {
        const config: SubAgentPluginConfiguration = this.specification?.configuration ?? {
            allowedAgentIdentityIds: [],
            maxSpawnDepth: 3,
            deleteRoomOnCompletion: true,
            passContextToSubAgent: false,
            contextMessageCount: 10,
            subRoomNamePrefix: 'sub-room',
            timeoutMs: 120000,
        };

        const allowedIds: string[] = (config.allowedAgentIdentityIds ?? []).map(id => id.toString());
        const agentIdDescription = allowedIds.length > 0
            ? `The exact ObjectId of the agent to spawn. You MUST use one of these exact values: ${allowedIds.join(', ')}`
            : 'No agents are configured as allowed — this tool will always fail.';

        const spawnSchema = {
            name: 'spawn_subagent',
            description: `Spawns a sub-agent in an ephemeral room to perform a delegated task synchronously. Returns a JSON result with the sub-agent's response.`,
            schema: z.object({
                agentIdentityId: z.string().describe(agentIdDescription),
                taskDescription: z.string().describe('The task or question to send to the sub-agent as its initial message.'),
                jobConfigurationIds: z.array(z.string()).optional().describe('Optional array of ChatJobConfiguration ObjectId strings to assign to the sub-agent.'),
            }),
        };

        return [
            tool(
                async (options: z.infer<typeof spawnSchema.schema>): Promise<string> => {
                    return this.runSubAgent(options, config);
                },
                spawnSchema
            ),
        ];
    }

    private async runSubAgent(
        options: { agentIdentityId: string; taskDescription: string; jobConfigurationIds?: string[]; },
        config: SubAgentPluginConfiguration,
    ): Promise<string> {
        console.log(`We got the tools!`);
        const depthKey = this.chatRoom.data._id.toString();

        try {
            // Validate allowlist — normalize to strings since stored IDs may be ObjectId instances.
            const allowedStrings = config.allowedAgentIdentityIds.map(id => id.toString());
            if (!allowedStrings.includes(options.agentIdentityId)) {
                return JSON.stringify(<SubAgentResult>{
                    success: false, subRoomId: '', agentIdentityId: options.agentIdentityId,
                    agentName: '', responseMessages: [], finalResponse: '',
                    errorMessage: `Agent identity '${options.agentIdentityId}' is not in the allowed list for this plugin.`,
                });
            }

            // Check spawn depth
            const currentDepth = activeSpawnDepths.get(depthKey) ?? 0;
            if (currentDepth >= config.maxSpawnDepth) {
                return JSON.stringify(<SubAgentResult>{
                    success: false, subRoomId: '', agentIdentityId: options.agentIdentityId,
                    agentName: '', responseMessages: [], finalResponse: '',
                    errorMessage: `Maximum spawn depth of ${config.maxSpawnDepth} exceeded.`,
                });
            }

            activeSpawnDepths.set(depthKey, currentDepth + 1);
            console.log(`[SubAgentPlugin] Spawning sub-agent | parentRoom=${depthKey} depth=${currentDepth + 1}/${config.maxSpawnDepth} agentIdentityId=${options.agentIdentityId}`);

            // Load agent identity
            const identityId = new ObjectId(options.agentIdentityId);
            const identity = await this.agentDbService.getAgentIdentityById(identityId);
            if (!identity) {
                return JSON.stringify(<SubAgentResult>{
                    success: false, subRoomId: '', agentIdentityId: options.agentIdentityId,
                    agentName: '', responseMessages: [], finalResponse: '',
                    errorMessage: `Agent identity '${options.agentIdentityId}' not found.`,
                });
            }

            // Validate same project
            if (!identity.projectId.equals(this.chatRoom.data.projectId)) {
                return JSON.stringify(<SubAgentResult>{
                    success: false, subRoomId: '', agentIdentityId: options.agentIdentityId,
                    agentName: '', responseMessages: [], finalResponse: '',
                    errorMessage: `Agent identity '${options.agentIdentityId}' does not belong to this project.`,
                });
            }

            // Build task message (optionally with parent context)
            let taskMessage = options.taskDescription;
            if (config.passContextToSubAgent && this.chatRoom.messages.length > 0) {
                const recent = this.chatRoom.messages.slice(-config.contextMessageCount);
                const contextBlock = recent.map(m => {
                    const role = m.getType() === 'human' ? 'User' : 'Agent';
                    const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
                    return `[${role}]: ${content}`;
                }).join('\n');
                taskMessage = `[PARENT CONTEXT]\n${contextBlock}\n[END CONTEXT]\n\nTASK: ${options.taskDescription}`;
            }

            console.log(`[SubAgentPlugin] Agent identity resolved | name="${identity.name}" task="${options.taskDescription.slice(0, 80)}${options.taskDescription.length > 80 ? '…' : ''}"`);

            // Create ephemeral sub-room
            const subRoom = await this.chatRoomDbService.upsertChatRoom({
                name: `${config.subRoomNamePrefix}-${Date.now()}`,
                projectId: this.chatRoom.data.projectId,
                userId: this.chatRoom.data.userId,
                isBusy: false,
                agents: [],
                jobs: [],
                conversation: [],
                roomInstructions: [],
                documents: [],
                userParticipants: [],
                logs: [],
                plugins: [],
                chatDocumentReferences: [],
                isEphemeral: true,
            } as any);

            console.log(`[SubAgentPlugin] Sub-room created | roomId=${subRoom._id} name="${subRoom.name}"`);

            let agentInstance: { _id: ObjectId; } | undefined;
            let defaultJobConfigId: ObjectId | undefined;
            try {
                // Add agent instance
                agentInstance = await this.chatCoreService.createAgentInstanceForChatRoom(
                    subRoom._id,
                    identityId,
                    identity.chatName ?? identity.name,
                );

                console.log(`[SubAgentPlugin] Agent instance added | instanceId=${agentInstance._id}`);

                // Add job instances
                if (options.jobConfigurationIds?.length) {
                    for (const jobId of options.jobConfigurationIds) {
                        const jobInst = await this.chatCoreService.createJobInstanceForChatRoom(
                            subRoom._id,
                            new ObjectId(jobId),
                        );
                        await this.chatCoreService.assignAgentToJobInstance(
                            subRoom._id,
                            agentInstance._id,
                            jobInst.id,
                        );
                    }
                } else {
                    // No jobs specified — create a minimal default job so the agent has a turn to execute.
                    defaultJobConfigId = await this.chatCoreService.createDefaultJobInstanceForChatRoom(
                        subRoom._id,
                        agentInstance._id,
                        subRoom.projectId,
                    );
                }

                // Load user
                const user = await this.authDbService.getUserById(this.chatRoom.data.userId);
                if (!user) {
                    return JSON.stringify(<SubAgentResult>{
                        success: false, subRoomId: subRoom._id.toString(),
                        agentIdentityId: options.agentIdentityId, agentName: identity.name,
                        responseMessages: [], finalResponse: '',
                        errorMessage: 'Could not load the owning user for the sub-room.',
                    });
                }

                console.log(`[SubAgentPlugin] Sending task to sub-agent | roomId=${subRoom._id}`);

                // Execute sub-agent with timeout
                const controller = new AbortController();
                const timeoutHandle = setTimeout(() => controller.abort(), config.timeoutMs ?? 120000);
                let newMessages;
                try {
                    newMessages = await this.chattingServiceProvider().receiveChatMessage(
                        subRoom._id,
                        taskMessage,
                        user,
                        controller.signal,
                    );
                } finally {
                    clearTimeout(timeoutHandle);
                }

                console.log(`[SubAgentPlugin] Sub-agent completed | roomId=${subRoom._id} messages=${newMessages.length}`);

                // Build result
                const responseMessages = newMessages
                    .filter(m => m.getType() === 'ai' || m.getType() === 'tool')
                    .map(m => ({
                        role: (m.getType() === 'ai' ? 'ai' : 'tool') as 'ai' | 'tool',
                        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
                        name: (m as any).name as string | undefined,
                    }));

                const lastAi = [...newMessages].reverse().find(m => m instanceof AIMessage);
                const finalResponse = lastAi
                    ? (typeof lastAi.content === 'string' ? lastAi.content : JSON.stringify(lastAi.content))
                    : '';

                console.log(`[SubAgentPlugin] Final response | roomId=${subRoom._id} response="${finalResponse.slice(0, 120)}${finalResponse.length > 120 ? '…' : ''}"`);

                return JSON.stringify(<SubAgentResult>{
                    success: true,
                    subRoomId: subRoom._id.toString(),
                    agentIdentityId: options.agentIdentityId,
                    agentName: identity.name,
                    responseMessages,
                    finalResponse,
                });
            } finally {
                // Cleanup ephemeral room
                if (config.deleteRoomOnCompletion) {
                    console.log(`[SubAgentPlugin] Cleaning up sub-room | roomId=${subRoom._id}`);
                    await this.chatRoomDbService.deleteChatRoom(subRoom._id).catch(() => undefined);
                    if (agentInstance) {
                        await this.agentInstanceDbService.deleteAgent(agentInstance._id).catch(() => undefined);
                    }
                    if (defaultJobConfigId) {
                        await this.chatCoreService.chatJobDbService.deleteChatJob(defaultJobConfigId).catch(() => undefined);
                    }
                }
            }
        } catch (err: any) {
            console.error(`[SubAgentPlugin] Error | parentRoom=${depthKey}`, err);
            return JSON.stringify(<SubAgentResult>{
                success: false, subRoomId: '', agentIdentityId: options.agentIdentityId,
                agentName: '', responseMessages: [], finalResponse: '',
                errorMessage: err?.message ?? String(err),
            });
        } finally {
            const d = activeSpawnDepths.get(depthKey) ?? 1;
            if (d <= 1) {
                activeSpawnDepths.delete(depthKey);
            } else {
                activeSpawnDepths.set(depthKey, d - 1);
            }
        }
    }
}
