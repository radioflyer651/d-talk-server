import { BaseMessage } from "@langchain/core/messages";
import { Annotation } from "@langchain/langgraph";


export const ChatState = Annotation.Root({
    messages: Annotation<BaseMessage[]>,
    sessionId: Annotation<string>,
    
})