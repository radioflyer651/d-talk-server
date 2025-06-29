import { ChatOpenAI } from "@langchain/openai";
import { ILlmProvider } from "../services/llm-providers/llm-provider.interface";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { z } from "zod";


/** Socket server that handles chat messages. */
export class ChatSocketServer {
    constructor(
        readonly llmProvider: ILlmProvider
    ) {

    }

    protected getLlm(): BaseChatModel {
        return this.llmProvider.getLlm();
    }

    receiveChatMessage(chatMessage: string) {
        const llm = this.getLlm();
        llm.withStructuredOutput(testMeSchema).invoke('atest');
    }
}

const testMeSchema = z.object({
    name: z.string()
});