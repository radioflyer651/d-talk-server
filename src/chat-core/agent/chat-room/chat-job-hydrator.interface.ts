import { ChatJobConfiguration } from "../../../model/shared-models/chat-core/chat-job-data.model";
import { ChatJobInstance } from "../../../model/shared-models/chat-core/chat-job-instance.model";
import { ChatJob } from "./chat-job.service";


/** Responsible for taking ChatJobData and returning a ChatJob for that data. */
export interface IJobHydratorService {
    hydrateJob(job: ChatJobInstance): Promise<ChatJob>;

    hydrateJobs(jobs: ChatJobInstance[]): Promise<ChatJob[]>;
}