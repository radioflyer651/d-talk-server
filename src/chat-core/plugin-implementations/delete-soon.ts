import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { TavilySearch } from '@langchain/tavily';

import { ChatOpenAI } from '@langchain/openai';
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";

// Define the tools for the agent to use
const agentTools = [new TavilySearchResults({ maxResults: 3 })];
const agentModel = new ChatOpenAI({ temperature: 0 });
const tools2 = [new TavilySearch({ maxResults: 3 })];

const thing = createReactAgent({
    llm: agentModel,
    tools: tools2
});
