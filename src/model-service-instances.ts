import { ModelServiceBase } from "./chat-core/agent/model-services/model-service-base.service";
import { OllamaAiAgentService } from "./chat-core/agent/model-services/ollama.model-service-service";
import { OpenAiAgentService } from "./chat-core/agent/model-services/open-model-service";


export const modelResolverServices: ModelServiceBase[] = [
    new OllamaAiAgentService(),
    new OpenAiAgentService(),
];