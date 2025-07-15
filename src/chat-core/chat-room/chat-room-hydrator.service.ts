import { AgentDbService } from "../../database/chat-core/agent-db.service";
import { AgentInstanceDbService } from "../../database/chat-core/agent-instance-db.service";
import { ChatRoomDbService } from "../../database/chat-core/chat-room-db.service";
import { ProjectDbService } from "../../database/chat-core/project-db.service";
import { AgentInstanceConfiguration } from "../../model/shared-models/chat-core/agent-instance-configuration.model";
import { ChatRoomData } from "../../model/shared-models/chat-core/chat-room-data.model";
import { getDistinctObjectIds } from "../../utils/get-distinct-object-ids.utils";
import { AgentServiceFactory } from "../agent-factory.service";
import { IPluginResolver } from "../agent-plugin/plugin-resolver.interface";
import { Agent } from "../agent/agent.service";
import { ChatDocumentResolutionService } from "../document/document-resolution.service";
import { IJobHydratorService } from "./chat-job-hydrator.interface";
import { IChatRoomHydratorService } from "./chat-room-hydrator.interface";
import { ChatRoom } from "./chat-room.service";


export class ChatRoomHydratorService implements IChatRoomHydratorService {
    constructor(
        readonly agentFactory: AgentServiceFactory,
        readonly chatRoomDbService: ChatRoomDbService,
        readonly pluginResolver: IPluginResolver,
        readonly jobHydratorService: IJobHydratorService,
        readonly agentDbService: AgentDbService,
        readonly agentInstanceDbService: AgentInstanceDbService,
        readonly projectDbService: ProjectDbService,
        readonly documentResolverService: ChatDocumentResolutionService,
    ) {
    }

    async hydrateChatRoom(chatRoomData: ChatRoomData): Promise<ChatRoom> {
        // Get the project.
        const projectP = this.projectDbService.getProjectById(chatRoomData.projectId);

        // Create the new chat room.
        const chatRoom = new ChatRoom(chatRoomData, this.chatRoomDbService);

        // Hydrate the appropriate properties.
        await this.hydrateAgents(chatRoom);
        await this.hydrateChatJobs(chatRoom);

        // Set the project on the chatRoom.
        const project = await projectP;
        if (!project) {
            throw new Error(`No project was found with the ID of ${chatRoomData.projectId}, on the chat room: ${chatRoomData._id}.`);
        }
        chatRoom.project = project;

        // Return the result.
        return chatRoom;
    }

    /** Loads the agent data, and creates new Agent objects for each. */
    private async hydrateAgents(chatRoom: ChatRoom): Promise<void> {
        // Get the agents from the database.
        let existingAgents: AgentInstanceConfiguration[] = [];
        const existingAgentIds = chatRoom.data.agents.map(a => a.instanceId).filter(a => !!a);
        if (existingAgentIds.length > 0) {
            existingAgents = await this.agentInstanceDbService.getAgentInstancesByIds(existingAgentIds);
        }

        // Get any agents that haven't been initialized yet.
        let newAgents: Agent[] = [];
        const newAgentConfigReferences = chatRoom.data.agents.filter(a => !a.instanceId);
        if (newAgentConfigReferences.length > 0) {
            // Get just the unique object IDs for the new agent configurations.
            const newAgentConfigIds = getDistinctObjectIds(newAgentConfigReferences.map(r => r.identityId));

            // Get the agent configurations.
            const newAgentConfigs = await this.agentDbService.getAgentIdentitiesByIds(newAgentConfigIds);

            // Create the enw agents.  We're doing it this long way in case an agent is listed twice.
            //  In that case, we'll have a single Agent Configuration for multiple references.
            const newAgentPromises = newAgentConfigReferences.map(async ref => {
                // Get the config for this.
                const config = newAgentConfigs.find(c => c._id.equals(ref.identityId));

                // This would be strange, but...
                if (!config) {
                    throw new Error(`No config found for ID: ${ref.identityId}`);
                }

                // Create a new agent for this configuration.
                const newAgent = await this.agentFactory.createAgent(config);

                // Now, update the reference, since it's still attached to the chat room data.  Thus, we update
                //  the chat room data.
                ref.instanceId = newAgent.data._id;

                // Return the agent, creating an array of agents.
                return newAgent;
            });

            // Wait for the new agents to be resolved.  This variable was previously
            //  created and will be added to the rest of the agents that already exist.
            newAgents = await Promise.all(newAgentPromises);

            // Update the chat room data, so we now have the instance references included.
            await this.chatRoomDbService.updateChatRoom(chatRoom.data._id, { agents: chatRoom.data.agents });
        }

        // Create the agents from these.
        const agentPromises = existingAgents.map(c => this.agentFactory.getAgent(c));
        const agents = await Promise.all(agentPromises);
        // Add the new agents.
        agents.push(...newAgents);

        // Set the chat room on these to this chat.
        agents.forEach(c => c.chatRoom = chatRoom);

        // Set the property with the agents.
        chatRoom.agents = agents;
    }

    /** Creates chat jobs from the data, and resolves their plugins. */
    private async hydrateChatJobs(chatRoom: ChatRoom) {
        chatRoom.chatJobs = await this.jobHydratorService.hydrateJobs(chatRoom.data.jobs);

        // The chat job instances may have been altered, so we need to save the references, just to be sure.
        await this.chatRoomDbService.updateChatRoom(chatRoom.data._id, { jobs: chatRoom.data.jobs });
    }
}