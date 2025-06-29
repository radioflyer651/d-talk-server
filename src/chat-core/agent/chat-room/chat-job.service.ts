import { AgentPluginBase } from "../../agent-plugin/agent-plugin-base.service";
import { ChatJobData } from "./chat-job-data.model";

export class ChatJob {
    constructor(
        readonly data: ChatJobData,
    ) {

    }

    /** The set of plugins used in this chat job. */
    plugins: AgentPluginBase[] = [];


}