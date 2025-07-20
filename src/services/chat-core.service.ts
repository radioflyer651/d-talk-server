import { AgentDbService } from "../database/chat-core/agent-db.service";
import { ChatJobDbService } from "../database/chat-core/chat-job-db.service";
import { ChatRoomDbService } from "../database/chat-core/chat-room-db.service";
import { ProjectDbService } from "../database/chat-core/project-db.service";
import { ObjectId } from 'mongodb';
import { NewDbItem } from "../model/shared-models/db-operation-types.model";
import { AgentInstanceConfiguration } from "../model/shared-models/chat-core/agent-instance-configuration.model";
import { AgentInstanceDbService } from '../database/chat-core/agent-instance-db.service';
import { ChatDocumentDbService } from "../database/chat-core/chat-document-db.service";


/** Handles non-pure data operations for Chat operations. */
export class ChatCoreService {
    constructor(
        readonly agentDbService: AgentDbService,
        readonly agentInstanceDbService: AgentInstanceDbService,
        readonly chatRoomDbService: ChatRoomDbService,
        readonly chatJobDbService: ChatJobDbService,
        readonly projectDbService: ProjectDbService,
        readonly documentDbService: ChatDocumentDbService,
    ) { }

    /**
     * Creates a new AgentInstanceConfiguration for a specific chat room, adds it to the DB, and updates the chat room's agent references.
     * @param chatRoomId The ObjectId of the chat room to add the agent to.
     * @param identityId The ObjectId of the agent identity to use.
     * @param agentName The name for the new agent instance.
     * @returns The created AgentInstanceConfiguration.
     */
    async createAgentInstanceForChatRoom(chatRoomId: ObjectId, identityId: ObjectId, agentName: string) {
        // Fetch the chat room
        const chatRoom = await this.chatRoomDbService.getChatRoomById(chatRoomId);
        if (!chatRoom) {
            throw new Error('Chat room not found');
        }

        // Create the new agent instance configuration
        const newAgent: NewDbItem<AgentInstanceConfiguration> = {
            identity: identityId,
            name: agentName,
            plugins: [],
            chatDocumentReferences: [],
            projectId: chatRoom.projectId
        };

        // Insert the agent instance
        const createdAgent = await this.agentInstanceDbService.upsertAgent(newAgent);

        // Add the agent reference to the chat room's agents array
        if (!chatRoom.agents) {
            chatRoom.agents = [];
        }
        chatRoom.agents.push({ identityId, instanceId: createdAgent._id });
        await this.chatRoomDbService.updateChatRoom(chatRoomId, { agents: chatRoom.agents });

        // Return the new agent.
        return createdAgent;
    }

    /**
     * Deletes an agent instance from a chat room by its instance ID.
     * Removes the agent reference from the chat room and deletes the agent instance from the database.
     * @param chatRoomId The ObjectId of the chat room.
     * @param agentInstanceId The ObjectId of the agent instance to delete.
     */
    async deleteAgentInstanceFromChatRoom(chatRoomId: ObjectId, agentInstanceId: ObjectId) {
        // Fetch the chat room
        const chatRoom = await this.chatRoomDbService.getChatRoomById(chatRoomId);
        if (!chatRoom) {
            throw new Error('Chat room not found');
        }
        // Remove the agent reference from the chat room's agents array
        chatRoom.agents = chatRoom.agents.filter(ref => !ref.instanceId.equals(agentInstanceId));
        // Remove the agent from any job instances in the chat room
        if (Array.isArray(chatRoom.jobs)) {
            for (const jobInstance of chatRoom.jobs) {
                if (jobInstance.agentId && jobInstance.agentId.equals(agentInstanceId)) {
                    jobInstance.agentId = undefined;
                }
            }
        }
        await this.chatRoomDbService.updateChatRoom(chatRoomId, { agents: chatRoom.agents, jobs: chatRoom.jobs });
        // Delete the agent instance from the database
        await this.agentInstanceDbService.deleteAgent(agentInstanceId);
    }

    /**
     * Creates a new ChatJobInstance for a chat room and adds it to the chat room's jobs list.
     * @param chatRoomId The ObjectId of the chat room.
     * @param jobConfigurationId The ObjectId of the chat job configuration to use.
     * @param agentId The ObjectId of the agent instance to assign to this job instance.
     * @returns The created ChatJobInstance.
     */
    async createJobInstanceForChatRoom(chatRoomId: ObjectId, jobConfigurationId: ObjectId) {
        // Fetch the chat room
        const chatRoom = await this.chatRoomDbService.getChatRoomById(chatRoomId);
        if (!chatRoom) {
            throw new Error('Chat room not found');
        }
        // Fetch the job configuration
        const jobConfig = await this.chatJobDbService.getChatJobById(jobConfigurationId);
        if (!jobConfig) {
            throw new Error('Job configuration not found');
        }
        // Check that the job and the room are in the same project
        if (!jobConfig.projectId.equals(chatRoom.projectId)) {
            throw new Error('Job configuration and chat room must belong to the same project');
        }
        // Create the new job instance
        const newJobInstance = {
            id: new ObjectId(),
            configurationId: jobConfigurationId,
            disabled: false,
            agentId: undefined,
            pluginReferences: []
        };
        // Add to the chat room's jobs array
        if (!Array.isArray(chatRoom.jobs)) {
            chatRoom.jobs = [];
        }
        chatRoom.jobs.push(newJobInstance);
        await this.chatRoomDbService.updateChatRoom(chatRoomId, { jobs: chatRoom.jobs });
        return newJobInstance;
    }

    /**
     * Assigns an agent instance to a job instance in a chat room.
     * @param chatRoomId The ObjectId of the chat room.
     * @param agentInstanceId The ObjectId of the agent instance to assign.
     * @param jobInstanceId The ObjectId of the job instance to update.
     */
    async assignAgentToJobInstance(chatRoomId: ObjectId, agentInstanceId: ObjectId, jobInstanceId: ObjectId) {
        // Fetch the chat room
        const chatRoom = await this.chatRoomDbService.getChatRoomById(chatRoomId);
        if (!chatRoom) {
            throw new Error('Chat room not found');
        }
        // Validate agent is in the room's agent list
        const agentInRoom = chatRoom.agents.some(ref => ref.instanceId.equals(agentInstanceId));
        if (!agentInRoom) {
            throw new Error('Agent instance is not in the chat room');
        }
        // Find the job instance
        const jobInstance = chatRoom.jobs.find(j => j.id.equals(jobInstanceId));
        if (!jobInstance) {
            throw new Error('Job instance not found in chat room');
        }
        // Set the agentId
        jobInstance.agentId = agentInstanceId;
        await this.chatRoomDbService.updateChatRoom(chatRoomId, { jobs: chatRoom.jobs });
    }

    async removeAgentFromJobInstance(chatRoomId: ObjectId, jobInstanceId: ObjectId) {
        // Fetch the chat room
        const chatRoom = await this.chatRoomDbService.getChatRoomById(chatRoomId);
        if (!chatRoom) {
            throw new Error('Chat room not found');
        }

        // Find the chat job instance.
        const instance = chatRoom.jobs.find(j => j.id.equals(jobInstanceId));

        // Validate the instance.
        if (!instance) {
            throw new Error(`No instance was found for ID: ${jobInstanceId}`);
        }

        // Remove the agent.
        instance.agentId = undefined;

        // Update the job in the database.
        await this.chatRoomDbService.updateChatRoom(chatRoomId, { jobs: chatRoom.jobs });
    }

    /**
     * Gets all agent instances for a given chat room by its ID.
     * @param chatRoomId The ObjectId of the chat room.
     * @returns Array of AgentInstanceConfiguration for the chat room.
     */
    async getAgentInstancesForChatRoom(chatRoomId: ObjectId) {
        // Fetch the chat room
        const chatRoom = await this.chatRoomDbService.getChatRoomById(chatRoomId);
        if (!chatRoom) {
            throw new Error('Chat room not found');
        }
        // Collect all agent instance IDs from the chat room's agents array
        const agentInstanceIds = (chatRoom.agents || []).map(ref => ref.instanceId);
        if (agentInstanceIds.length === 0) {
            return [];
        }
        // Fetch all agent instances by their IDs
        return await this.agentInstanceDbService.getAgentInstancesByIds(agentInstanceIds);
    }

    /**
     * Removes a job instance from a chat room by job instance ID.
     * @param chatRoomId The ObjectId of the chat room.
     * @param jobInstanceId The ObjectId of the job instance to remove.
     */
    async removeJobInstanceFromChatRoom(chatRoomId: ObjectId, jobInstanceId: ObjectId) {
        // Fetch the chat room
        const chatRoom = await this.chatRoomDbService.getChatRoomById(chatRoomId);
        if (!chatRoom) {
            throw new Error('Chat room not found');
        }
        // Remove the job instance from the jobs array
        const originalLength = chatRoom.jobs.length;
        chatRoom.jobs = chatRoom.jobs.filter(j => !j.id.equals(jobInstanceId));
        if (chatRoom.jobs.length === originalLength) {
            throw new Error('Job instance not found in chat room');
        }
        // Update the chat room in the database
        await this.chatRoomDbService.updateChatRoom(chatRoomId, { jobs: chatRoom.jobs });
    }

    /** Moves a specified job, in a specified chat room, to a new position in the execution order. */
    async setJobInstanceOrder(chatRoomId: ObjectId, jobId: ObjectId, newPosition: number): Promise<void> {
        // Get the chat room.
        const room = await this.chatRoomDbService.getChatRoomById(chatRoomId);

        // If not found, then we have issues.
        if (!room) {
            throw new Error(`No Room with the ID ${chatRoomId} was found.`);
        }

        // Take the job out of the jobs list, and validate it.
        const jobIndex = room.jobs.findIndex(j => j.id.equals(jobId));
        if (jobIndex < 0) {
            throw new Error(`No job with ID ${jobId} was found.`);
        }
        const job = room.jobs.splice(jobIndex, 1)[0];

        // Place the job back, in the proper position.
        if (newPosition > room.jobs.length - 1) {
            room.jobs.push(job);
        } else {
            room.jobs.splice(newPosition, 0, job);
        }

        // Save the jobs back to the chat room.
        this.chatRoomDbService.updateChatRoom(chatRoomId, { jobs: room.jobs });
    }

    /** Deletes a specified chat room, and all associated resources, from the system. */
    async deleteProject(projectId: ObjectId): Promise<void> {
        // Get the chat room.
        const project = await this.projectDbService.getProjectById(projectId);

        // Validate
        if (!project) {
            throw new Error(`Project with ID ${projectId?.toString()} does not exist.`);
        }

        // Delete all of the parts of the project.
        const agentsP = this.agentDbService.deleteAgentIdentitiesByProjectId(projectId);
        const jobsP = this.chatJobDbService.deleteChatJobsByProjectId(projectId);
        const projectP = this.chatRoomDbService.deleteChatRoomsByProjectId(projectId);
        const documentsP = this.documentDbService.deleteDocumentsByProjectId(projectId);

        // Wait for them to complete.
        await Promise.all([agentsP, jobsP, projectP, documentsP]);
    }
}