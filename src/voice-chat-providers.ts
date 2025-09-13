import { IAppConfig } from "./model/app-config.model";
import { HumeVoiceChatService } from "./services/voice-chat-services/hume-voice-chat.service";
import { OpenAiVoiceChatService } from "./services/voice-chat-services/openai-voice-chat.service";
import { IVoiceChatProvider } from "./services/voice-chat-services/voice-chat-provider.interface";

export let humeVoiceChatService: HumeVoiceChatService;

export async function getVoiceChatProviders(appConfig: IAppConfig) {
    const result: IVoiceChatProvider<any>[] = [];

    if (appConfig.humeCredentials) {
        humeVoiceChatService = new HumeVoiceChatService(appConfig);
        result.push(humeVoiceChatService);
    }

    if (appConfig.openAiConfig) {
        result.push(new OpenAiVoiceChatService(appConfig));
    }

    return result;
}