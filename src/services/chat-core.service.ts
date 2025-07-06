import { AgentDbService } from "../database/chat-core/agent-db.service";
import { ChatJobDbService } from "../database/chat-core/chat-job-db.service";
import { ChatRoomDbService } from "../database/chat-core/chat-room-db.service";
import { ProjectDbService } from "../database/chat-core/project-db.service";


/** Handles non-pure data operations for Chat operations. */
export class ChatCoreManagementService {
    constructor(
        readonly agentDbService: AgentDbService,
        readonly chatRoomDbService: ChatRoomDbService,
        readonly chatJobDbService: ChatJobDbService,
        readonly projectDbService: ProjectDbService,
    ){}

    
}