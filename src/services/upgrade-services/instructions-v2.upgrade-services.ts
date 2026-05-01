import { ObjectId } from 'mongodb';
import { AgentDbService } from '../../database/chat-core/agent-db.service';
import { ChatJobDbService } from '../../database/chat-core/chat-job-db.service';
import { DbUpdateServiceDb } from '../../database/db-update-db.service';

export const AGENT_AND_JOB_MESSAGES_UPDATE_ID = 'AgentAndJobUpdateMessages';
export const CHAT_JOB_MESSAGES_UPDATE_ID = 'ChatJobUpdateMessages';

async function performAgentUpdates(agentDbService: AgentDbService, dbUpdateDbService: DbUpdateServiceDb) {
    const executionRecord = await dbUpdateDbService.getByName(AGENT_AND_JOB_MESSAGES_UPDATE_ID);

    if (executionRecord) {
        console.log(`Agent instruction update, to include _id properties, already complete.`);
        return;
    }

    console.log(`Updating agent instructions to include _id properties.`);

    const batchSize = 20;
    let currentOffset = 0;
    let hasMoreRecords = true;

    do {
        const currentSet = await agentDbService.getAllAgents(currentOffset, batchSize);

        currentOffset = currentOffset + currentSet.data.length;
        hasMoreRecords = currentOffset < currentSet.totalCount;

        currentSet.data.forEach(agent => {
            agent.identityStatements.forEach(instruction => {
                instruction._id ??= new ObjectId();
            });
            agent.baseInstructions.forEach(instruction => {
                instruction._id ??= new ObjectId();
            });
        });

        for (let agent of currentSet.data) {
            await agentDbService.updateAgentIdentity(agent._id, agent);
        }

    } while (hasMoreRecords);

    dbUpdateDbService.insertIfNotExists(AGENT_AND_JOB_MESSAGES_UPDATE_ID);
}


/**
 * Performs an update that ensures each instruction message in every ChatJob has an _id assigned.
 */
async function performChatJobUpdates(chatJobDbService: ChatJobDbService, dbUpdateDbService: DbUpdateServiceDb) {
    const executionRecord = await dbUpdateDbService.getByName(CHAT_JOB_MESSAGES_UPDATE_ID);

    if (executionRecord) {
        console.log(`Updates to jobs, to include _id properties, already complete.`);
        return;
    }

    console.log(`Updating chat job instructions to include _id properties.`);

    const batchSize = 20;
    let currentOffset = 0;
    let hasMoreRecords = true;

    do {
        const currentSet = await chatJobDbService.getAllChatJobs(currentOffset, batchSize);

        currentOffset = currentOffset + currentSet.data.length;
        hasMoreRecords = currentOffset < currentSet.totalCount;

        currentSet.data.forEach(job => {
            job.instructions.forEach(instruction => {
                instruction._id ??= new ObjectId();
            });
        });

        for (const job of currentSet.data) {
            await chatJobDbService.updateChatJob(job._id, { instructions: job.instructions });
        }

    } while (hasMoreRecords);

    dbUpdateDbService.insertIfNotExists(CHAT_JOB_MESSAGES_UPDATE_ID);
}

/** Ensures that instructions on chat jobs and agents all have IDs. */
export async function updateInstructionMessages(agentDbService: AgentDbService, chatJobDbService: ChatJobDbService, dbUpdateDbService: DbUpdateServiceDb) {
    await Promise.all([
        performChatJobUpdates(chatJobDbService, dbUpdateDbService),
        performAgentUpdates(agentDbService, dbUpdateDbService)
    ]);
}
