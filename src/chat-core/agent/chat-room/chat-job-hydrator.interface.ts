import { ChatJobData } from "../../../model/shared-models/chat-core/chat-job-data.model";
import { ChatJob } from "./chat-job.service";


/** Responsible for taking ChatJobData and returning a ChatJob for that data. */
export interface IJobHydratorService {
    hydrateJob(job: ChatJobData): Promise<ChatJob>;

    hydrateJobs(jobs: ChatJobData[]): Promise<ChatJob[]>;
}