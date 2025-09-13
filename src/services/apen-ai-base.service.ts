import OpenAI from "openai";
import { IAppConfig } from "../model/app-config.model";


/** Provides base functionality for a service interacting directly with OpenAI. */
export abstract class OpenAiServiceBase {
    constructor(config: IAppConfig) {
        this.openAi = new OpenAI({ apiKey: config.openAiConfig.openAiKey, organization: config.openAiConfig.openAiOrg });
    }

    protected openAi: OpenAI;
    
}