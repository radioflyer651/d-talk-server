import { AgentDbService } from "../database/chat-core/agent-db.service";
import { ChatJobDbService } from "../database/chat-core/chat-job-db.service";
import { ChatRoomDbService } from "../database/chat-core/chat-room-db.service";
import { ProjectDbService } from "../database/chat-core/project-db.service";
import { ObjectId } from 'mongodb';
import { NewDbItem } from "../model/shared-models/db-operation-types.model";
import { AgentInstanceConfiguration } from "../model/shared-models/chat-core/agent-instance-configuration.model";


/** Handles non-pure data operations for Chat operations. */
export class ChatCoreService {
    constructor(
        readonly agentDbService: AgentDbService,
        readonly chatRoomDbService: ChatRoomDbService,
        readonly chatJobDbService: ChatJobDbService,
        readonly projectDbService: ProjectDbService,
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
            instancePlugins: [],
            permanentPlugins: [],
            projectId: chatRoom.projectId
        };

        // Insert the agent instance
        const createdAgent = await this.agentDbService.upsertAgent(newAgent);

        // Add the agent reference to the chat room's agents array
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
        await this.chatRoomDbService.updateChatRoom(chatRoomId, { agents: chatRoom.agents });
        // Delete the agent instance from the database
        await this.agentDbService.deleteAgent(agentInstanceId);
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
}