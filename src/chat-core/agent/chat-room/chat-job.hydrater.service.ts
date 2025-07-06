import { ChatRoomDbService } from "../../../database/chat-core/chat-room-db.service";
import { IPluginResolver } from "../../agent-plugin/plugin-resolver.interface";
import { ChatJobConfiguration } from "../../../model/shared-models/chat-core/chat-job-data.model";
import { IJobHydratorService } from "./chat-job-hydrator.interface";
import { ChatJob } from "./chat-job.service";
import { hydratePositionableMessages } from "../../../utils/positionable-message-hydration.utils";
import { ChatJobInstance } from "../../../model/shared-models/chat-core/chat-job-instance.model";
import { ChatJobDbService } from "../../../database/chat-core/chat-job-db.service";

export class JobHydrator implements IJobHydratorService {
    constructor(
        readonly chatDbService: ChatRoomDbService,
        readonly pluginHydrator: IPluginResolver,
        readonly chatJobDbService: ChatJobDbService,
    ) {

    }

    async hydrateJob(job: ChatJobInstance): Promise<ChatJob> {
        // Get the configuration for this job.
        const jobConfiguration = await this.chatJobDbService.getChatJobById(job.configurationId);

        // If not found, then we have issues.
        if (!jobConfiguration) {
            throw new Error(`Chat job configuration ${job.configurationId} does not exist in the database.`);
        }

        // Create the new job.
        const newJob = new ChatJob(jobConfiguration, job);

        // Hydrate the plugins.
        newJob.plugins = await this.pluginHydrator.getPluginInstances(job.pluginReferences);

        // Hydrate the messages.
        newJob.positionableMessages = hydratePositionableMessages(jobConfiguration.instructions);

        // Return the job.
        return newJob;
    }

    async hydrateJobs(jobs: ChatJobInstance[]): Promise<ChatJob[]> {
        const jobPromises = jobs.map(j => this.hydrateJob(j));

        // Wait for them all to complete.
        const result = await Promise.all(jobPromises);

        // Return the result.
        return result;
    }


}