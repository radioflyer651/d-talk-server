import { ollamaModelConfigDbService } from "../../app-globals";
import { OllamaAiAgentService } from "./model-services/ollama.model-service-service";
import { OpenAiAgentService } from "./model-services/open-model-service";


/** The list of types of chat models that can be created. */
export const chatAgents = [
    new OpenAiAgentService(),
    new OllamaAiAgentService(ollamaModelConfigDbService),
];

/** List of possible chat model services. */
export const agentChatTypeNames = chatAgents.map(c => c.serviceType);

/** Enumerates the types of chat agents that can be created. */
export type ChatAgentLlmTypes = typeof agentChatTypeNames[number];
