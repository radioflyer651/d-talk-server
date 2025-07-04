
# DTalk2
Why the name?  Because I'm dumb - I created a "dungeon chat" app once for dungeons and dragons.  It turned into a general chat app.  This is its successor.  Was the answer worth the question? :)

## Features

### Chat Projects
Projects are the containers for a full data set.  Think of it like a "save game", where nothing (or probably nothing) inside a project will have access to content in another project.

### Chat Room
A chat room is an "environment" for users and/or chat agents.

The chat room will have an expandable set of features/capabilities to allow collaboration among the chat agents and the user(s).  This includes a "document" section for producing output and other collaborative efforts with the chat agents.  The room will also facilitate the ability for communications among the agents.

On the front end, this includes appropriate controls and panes needed for user interaction.

On the back end, it will constitute a data set of the discussion, and references to the chat agents.  Further, it will implement an orchestration mechanism to provide "traffic control" of the chat agents having turns to speak.  This orchestration will be handled by a separate service mechanism though, and not only a dependency to the chat room - not part of the chat room itself.

### Chat Agents
A chat agent will be an agent with basic instructions, to form a unique perspective in chat.

Chat agents may be provided tools as part of their configuration, or as part of the activity they are taking part in.  Perhaps in one chat room, there are documents that may be interacted with.  In such a case, the room may provide tools to the chat agent to participate in document activities.  Another room may not have these tools, and so the agent would have access to the same tools in the other room.  Some agents may specifically be given access to tools, such as web search, as part of their configuration, so they always have it.

#### Instances Vs. Configuration
A Chat agent will have a single configuration, but may have many instances of that agent.  This makes them reusable for many different chat rooms.  Chat histories will not be shared between agent instances, but long term memory will be.

#### Context Plugins (for Agents)
Agents will be equipped with  Context Plugins, which may or may not be powered by LLM, to assist in automated tasks, and may or may not be directly controlled by the chat agent.  Such tasks might be to perform long-term memory searches and/or storage calls before and/or after chat interactions.

Some context plugins may come with tools, so the agent can manipulate the plugin's behaviors, but not always.

Plugins may also provide special instructions and notifications to the agent, to inform them of the abilities and services provided by the plugin.  This may not always be necessary, but there may be times when it is.

**Plugin Examples**
  - Document Windows for Chat Rooms
  - Long Term memory agents, powered by LLMs, which watch the chat messages, and store/retrieve long-term memories for the host chat agent.
  - KnowledgeStore references.
  - Agent Instruction Sets applied to the agent.
  - Chat Context Reducers/Managers

##### Plugin Notifications
All components/feature that are able to be applied to agents will be able to provide information to the chat agent, so they are aware of these features.

#### Long Term Memory
At least one ore more Subconscious Agent will be implemented to monitor and store information during chat interactions, as well as recall long term memory.

### LLM Service Support
Chat agents may be configured for various LLM providers using LangChain's abstractions.  Further, they will be able to use various models from those providers through configuration.

### Data Stores

#### KnowledgeStore
Projects will have sets of KnowledgeStores, which are simply sets of name/value pairs.  The values of these stores may be long or short, but provide important information, useful to chat agents.

KnowledgeStores will be made accessible to agents, and through rooms.

#### Agent Instruction Sets
Agent Instruction Sets will be sets of system instructions, stored for reuse.  These instruction sets will be able to be applied to agents, either as part of their long-term configuration, or just specifically to the instances of an agent.  They will be able to be applied and removed at any time.

These instructions sets will simply be added as system instructions to the agent's chat history.

