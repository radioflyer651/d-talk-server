import { Container } from 'inversify';
import { TOKENS } from './tokens';
import { AgentDbService } from './database/chat-core/agent-db.service';
import { ChatJobDbService } from './database/chat-core/chat-job-db.service';
import { DbUpdateServiceDb } from './database/db-update-db.service';
import { updateInstructionMessages } from './services/upgrade-services/instructions-v2.upgrade-services';

/** Handles misc setup and initialization of things like file folders and the like. */
export async function systemInitialization(container: Container): Promise<void> {
    const agentDbService = await container.getAsync<AgentDbService>(TOKENS.AgentDbService);
    const chatJobDbService = await container.getAsync<ChatJobDbService>(TOKENS.ChatJobDbService);
    const dbUpdateDbService = await container.getAsync<DbUpdateServiceDb>(TOKENS.DbUpdateDbService);

    await updateInstructionMessages(agentDbService, chatJobDbService, dbUpdateDbService);
}
