import { AdminDbService } from "../database/admin-db.service";
import { AgentDbService } from "../database/chat-core/agent-db.service";
import { ProjectDbService } from "../database/chat-core/project-db.service";


export class UserAccessService {
    constructor(
        readonly adminService: AdminDbService,
        readonly projectDbService: ProjectDbService,
        readonly agentDbService: AgentDbService,
    ) {

    }

    
}