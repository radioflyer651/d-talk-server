import { ObjectId } from 'mongodb';
import { agentDbService, chatJobDbService, dbUpdateDbService } from '../../app-globals';

export const AGENT_AND_JOB_MESSAGES_UPDATE_ID = 'AgentAndJobUpdateMessages';
export const CHAT_JOB_MESSAGES_UPDATE_ID = 'ChatJobUpdateMessages';

async function performAgentUpdates() {
    // Check if we've executed already.
    const executionRecord = await dbUpdateDbService.getByName(AGENT_AND_JOB_MESSAGES_UPDATE_ID);

    // If so, exit, and go no further.
    if (executionRecord) {
        console.log(`Agent instruction update, to include _id properties, already complete.`);
        return;
    }

    console.log(`Updating agent instructions to include _id properties.`);

    // Get the first set of records.
    const batchSize = 20;
    let currentOffset = 0;
    let hasMoreRecords = true;

    do {
        // Get the next set to edit.
        const currentSet = await agentDbService.getAllAgents(currentOffset, batchSize);

        // Update our parameters for the next iteration.
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

        // Update the items in the database.
        for (let agent of currentSet.data) {
            await agentDbService.updateAgentIdentity(agent._id, agent);
        }

    } while (hasMoreRecords);

    // Record that we've done this work, so we don't do it again.
    dbUpdateDbService.insertIfNotExists(AGENT_AND_JOB_MESSAGES_UPDATE_ID);
}


/**
 * Performs an update that ensures each instruction message in every ChatJob has an _id assigned.
 *
 * This is similar to performAgentUpdates but operates on ChatJobs instead of Agent identity/instructions.
 * The intent is to migrate existing records that may have instruction entries without an ObjectId for internal UI tracking.
 */
async function performChatJobUpdates() {
    // Check if we've executed already.
    const executionRecord = await dbUpdateDbService.getByName(CHAT_JOB_MESSAGES_UPDATE_ID);

    // If so, exit, and go no further.
    if (executionRecord) {
        console.log(`Updates to jobs, to include _id properties, already complete.`);
        return;
    }

    console.log(`Updating chat job instructions to include _id properties.`);

    // Get the first set of records.
    const batchSize = 20;
    let currentOffset = 0;
    let hasMoreRecords = true;

    do {
        // Get the next set to edit.
        const currentSet = await chatJobDbService.getAllChatJobs(currentOffset, batchSize);

        // Update our parameters for the next iteration.
        currentOffset = currentOffset + currentSet.data.length;
        hasMoreRecords = currentOffset < currentSet.totalCount;

        // Assign missing _id values on instruction messages.
        currentSet.data.forEach(job => {
            job.instructions.forEach(instruction => {
                instruction._id ??= new ObjectId();
            });
        });

        // Persist the updated jobs.
        for (const job of currentSet.data) {
            await chatJobDbService.updateChatJob(job._id, { instructions: job.instructions });
        }

    } while (hasMoreRecords);

    // Record that we've done this work, so we don't do it again.
    dbUpdateDbService.insertIfNotExists(CHAT_JOB_MESSAGES_UPDATE_ID);
}

/** Ensures that instructions on chat jobs and agents all have IDs. */
export async function updateInstructionMessages() {
    await Promise.all([
        performChatJobUpdates(),
        performAgentUpdates()
    ]);
}