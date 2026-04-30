import { cloneJob } from './cloning-methods/clone-job';
import { ObjectId } from 'mongodb';
import { AgentDbService } from '../../database/chat-core/agent-db.service';
import { ChatJobDbService } from '../../database/chat-core/chat-job-db.service';
import { cloneAgentIdentity } from './cloning-methods/clone-agent-identity';

/**
 * Provides support for cloning chat objects (agents, jobs, etc.) and placing them back in the database.
 */
export class ChatCloningService {
    // Holds the database service used to interact with agent identity configurations.
    private readonly agentDbService: AgentDbService;

    // Holds the database service used to interact with chat job configurations.
    private readonly chatJobDbService: ChatJobDbService;

    /**
     * Creates a new instance of the cloning service with required database service dependencies.
     * @param agentDbService Service for CRUD operations on agent identity configurations.
     * @param chatJobDbService Service for CRUD operations on chat job configurations.
     */
    constructor(agentDbService: AgentDbService, chatJobDbService: ChatJobDbService) {
        // Assign the agent database service dependency.
        this.agentDbService = agentDbService;

        // Assign the chat job database service dependency.
        this.chatJobDbService = chatJobDbService;
    }

    async cloneAgentIdentity(identityId: ObjectId) {
        // Retrieve the agent identity from the database.
        const originalIdentity = await this.agentDbService.getAgentIdentityById(identityId);

        // If we don't have an identity, throw an error.
        if (!originalIdentity) {
            throw new Error(`Agent identity with ID ${identityId.toString()} not found.`);
        }

        // Create a clone of the agent identity.
        const clonedIdentity = cloneAgentIdentity(originalIdentity);

        // Place the cloned agent identity back into the database.
        const inserted = await this.agentDbService.upsertAgentIdentity(clonedIdentity);

        // Return the new ID of the newly cloned agent.
        return inserted._id;
    }

    async cloneChatJobConfiguration(jobId: ObjectId) {
        // Retrieve the chat job configuration from the database.
        const originalJob = await this.chatJobDbService.getChatJobById(jobId);

        // If we don't have a job, throw an error.
        if (!originalJob) {
            throw new Error(`Chat job configuration with ID ${jobId.toString()} not found.`);
        }

        // Create a clone of the job configuration.
        const clonedJob = cloneJob(originalJob);

        // Place the cloned job configuration back into the database.
        const inserted = await this.chatJobDbService.upsertChatJob(clonedJob);

        // Return the new ID of the newly cloned job configuration.
        return inserted;
    }
}