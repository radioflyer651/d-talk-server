import { ObjectId } from "mongodb";
import { AgentDbService } from "../../database/chat-core/agent-db.service";
import { ChatJobDbService } from "../../database/chat-core/chat-job-db.service";
import { ChatRoomDbService } from "../../database/chat-core/chat-room-db.service";
import { ProjectDbService } from "../../database/chat-core/project-db.service";
import { Project } from "../../model/shared-models/chat-core/project.model";
import { Agent } from "../agent/agent.service";
import { ChatJob } from "./chat-job.service";
import { IChatRoomSaverService } from "./chat-room-saver-service.interface";
import { ChatRoom } from "./chat-room.service";

export class ChatRoomSaverService implements IChatRoomSaverService {
    constructor(
        readonly chatRoomDbService: ChatRoomDbService,
        readonly chatJobDbService: ChatJobDbService,
        readonly chatAgentDbService: AgentDbService,
        readonly projectDbService: ProjectDbService,
    ) {

    }

    async updateChatRoom(chatRoom: ChatRoom): Promise<void> {
        chatRoom.updateDataForStorage();
        await this.chatRoomDbService.updateChatRoom(chatRoom.data._id, chatRoom.data);
    }

    async updateChatRoomConversation(chatRoom: ChatRoom): Promise<void> {
        chatRoom.updateDataForStorage();
        await this.chatRoomDbService.updateChatRoomConversation(chatRoom.data._id, chatRoom.data.conversation);
    }

    async updateChatJob(chatJob: ChatJob): Promise<void> {
        await this.chatJobDbService.updateChatJob(chatJob.data._id, chatJob.data);
    }

    async updateChatAgent(chatAgent: Agent): Promise<void> {
        await this.chatAgentDbService.updateAgentIdentity(chatAgent.identity._id, chatAgent.identity);
    }

    async updateProject(project: Project): Promise<void> {
        this.projectDbService.updateProject(project._id, project);
    }

    async addChatRoomLog(id: ObjectId, error: object): Promise<void> {
        await this.chatRoomDbService.addChatRoomLog(id, error);
    }
}