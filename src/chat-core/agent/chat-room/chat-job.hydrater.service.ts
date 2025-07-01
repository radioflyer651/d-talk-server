import { ChatRoomDbService } from "../../../database/chat-core/chat-room-db.service";
import { IPluginResolver } from "../../agent-plugin/plugin-resolver.interface";
import { ChatJobData } from "../../../model/shared-models/chat-core/chat-job-data.model";
import { IJobHydratorService } from "./chat-job-hydrator.interface";
import { ChatJob } from "./chat-job.service";

export class JobHydrator implements IJobHydratorService {
    constructor(
        readonly chatDbService: ChatRoomDbService,
        readonly pluginHydrator: IPluginResolver,
    ) {

    }

    async hydrateJob(job: ChatJobData): Promise<ChatJob> {
        // Create the new job.
        const newJob = new ChatJob(job);

        // Hydrate the plugins.
        newJob.plugins = await this.pluginHydrator.getPluginInstances(job.pluginReferences);

        // Return the job.
        return newJob;
    }

    async hydrateJobs(jobs: ChatJobData[]): Promise<ChatJob[]> {
        const jobPromises = jobs.map(j => this.hydrateJob(j));

        // Wait for them all to complete.
        const result = await Promise.all(jobPromises);

        // Return the result.
        return result;
    }


}