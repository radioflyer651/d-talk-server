---
applyTo: '**'
---

# Application D-Talk

## General
  - This application is named d-talk.
  - This is the server-side project for the application.
  - The application stack is primarily: Node, TypeScript, and MongoDB.
  - Some LangChain is used in the application.
  - The Factory Pattern is used heavily throughout the application.
  - Reference the [TypeScript Standards](./typescript-standards.instructions.md) when generating code.

## Application Purpose
The application is a general-purpose multi-agent chat application.  It's made to be customizable, with the ability easily add to features to chat agents.

## High Level Main Components
The main components of functionality are as follows:
  - ChatRoom: This represents a single chat session, composed of a "conversation", which is the chat history, one or more chat jobs, which each are controlled by an a chat agent.
    - When the user sends a chat message, each chat job is run, allowing the related chat agent to respond to the message.
    - Functional Service: `src/chat-core/chat-room/chat-room.service.ts`
    - Data Model: `src/model/shared-models/chat-core/chat-room-data.model.ts`
  - ChatAgent: An "agent" with an identity and general instructions.  A chat agent has a configuration of what LLM to use.
    - Agents are configured in 2 parts.  The first is a configuration defined by the project.  The second is an instance of that configuration, defined for a ChatRoom.
      - Configuration Model: `src/model/shared-models/chat-core/chat-room-data.model.ts`
      - Instance Model: `src/model/shared-models/chat-core/agent-instance-configuration.model.ts`
    - Functional Service: `src/chat-core/agent/agent.service.ts`
  - ChatJob/Task: A chat job, or task, represents a "turn" to interact with the chat conversation, within a chat room.
    - ChatJobs are defined in two parts.  The first is a configuration, defined for the project.  The second is an instance of that configuration, defined for a ChatRoom.
      - Configuration Model: `src/model/shared-models/chat-core/chat-job-data.model.ts`
      - Instance Model: `src/model/shared-models/chat-core/chat-job-instance.model.ts`
    - Each chat job is run for every message received by the user.
    - Each chat job has a chat agent associated with it.  It is the chat agent that performs the work fo the chat job.
    - Functional Service: `src/chat-core/chat-room/chat-job.service.ts`
  - Project: A project is a contained data set for the application.
    - The application can have multiple projects.
    - Each project has its own set of Chat Agents, Chat Jobs, Chat Rooms, and all associated data for the functionality of these items.
    - All data within a project is exclusive to that project, and not shared outside of a project.
  - Plugin: A plugin is an arbitrary piece of functionality that can be attached to a Chat Job or Chat Agent.
    - Plugins are the main way to add extensibility to the application.
    - Plugins implement the `IChatLifetimeContributor` interface.  (See below)
  - ChatDocument
    - An abstract "document" that can be interacted with by the user and chat agents.
    - Only the `TextDocument` is currently implemented, which contains general text.
    - Can be used for collaborative creation between users and agents, or as general purpose storage for context building.
    - Interacted with, by ChatAgents, through plugins.
    - `IChatDocumentData` type for any "document" type: `src/model/shared-models/chat-core/documents/chat-document.model.ts`
    - Functional Service: `src/chat-core/document/chat-document.service.ts`

## Chat Lifecycle
The following is a general set of actions that occur when a user sends a chat message:
  - ChatRoom is hydrated.  (The ChatRoom performs most of the work)
    - Hydrate Chat Agents
    - Hydrate Chat Jobs
    - Hydrate any other data associated to these elements.
  - Execute Each Chat Job
    - Each ChatJob is run with all chat history, including the incoming chat message, and running history of each ChatJob as it completes.
    - ChatJobs are run sequentially, only one ChatJob adding to the context at a time.
    - See the Chat Lifetime section below for more information on this process.

## Chat Lifetime (`IChatLifetimeContributor` interface)
  - The `IChatLifetimeContributor` can be found at `src/chat-core/chat-lifetime-contributor.interface.ts`.
  - All components contributing to a chat interaction (execution of a ChatJob) implement the `IChatLifetimeContributor` interface.
  - When a ChatJob executes a chat call, each `IChatLifetimeContributor` implementation executes the following methods (NOTE: Each method is optional, and implemented only when needed).
    - `getTools`: Obtains all ToolNodes that can be used in the chat call.
      - No execution of tools are called at this time, only created.
    - `initialize`: Allows the `IChatLifetimeContributor` implementation to perform any initialization it may need.
      - This can include calling a promise to be resolved later to enhance performance.
    - `preChat`: Called before the chat begins.  Receives the chat history (`callMessages`) to be passed to the LLM for, which may be modified or used in an arbitrary way.
      - NOTE: This method might not be useful.
    - `modifyCallMessages`: Receives all chat history to be sent to the LLM.  Returns a new chat history (or the same one) with modifications as required.
      - The returned chat history is used in the call to the LLM.
      - This set of messages will only be the messages from the chat history.  Instructions provided by the ChatRoom, ChatAgent, or ChatJob will be omitted from this history.
    - `addPreChatMessages`: One more chance to add messages to the chat history.
      - This allows any `IChatLifetimeContributor` to inspect messages from other `IChatLifetimeContributor`s, and add new messages based on those others.
    - `inspectChatCallMessages`: Final action to inspect the message history before the LLM call.
    - **Call LLM**: This is NOT a `IChatLifetimeContributor` method, but the LLM Chat call is made at this point in the lifetime order.
    - `handleReply`: Receives the LLM message, and optionally, causes another LLM Chat call to be made (returning to the "Call LLM" position in this order).
      - When another LLM call is required, this method will return new messages to add to the chat history for the new call.
      - This method returns undefined if another call is not required.
    - `peekToolCallMessages`: If the LLM makes a tool call, this method is called on implementors so they can inspect the new chat history and possibly take actions.
    - `chatComplete`: Called when all chat interactions are finished.
      - Allows implementors to read the final message history and take action.

### `IChatLifetimeContributor` Implementors
The following is an INCOMPLETE list of `IChatLifetimeContributor` implementations, which contribute to the chat interaction.
  - ChatRoom
    - Each ChatRoom has their own set of chat room messages, contribute to the LLM context.
  - ChatAgent
    - Each Agent has two sets of messages that contribute to the LLM context.
      - Identity: These are meant to inform the LLM Agent "Who it is", and give it its "personality".
      - Instructions: These are meant to instruct the LLM Agent how to behave.
  - ChatJob
    - Each ChatJob has its own set of instructions.
  - Plugin
    - Each plugin type has its own functionality and will implement the `IChatLifetimeContributor` in its own way.

### Implications 
The use of the `IChatLifetimeContributor` pipeline have the following implications:
  - The chat history is maintained for a ChatRoom, and is considered the only permanent history in the system.
  - `IChatLifetimeContributor` implementations add to a **temporary** chat history for each LLM call.
    - Messages added to the chat history from `IChatLifetimeContributor` implementors are not persisted after the chat call.
  - Only the responses from the LLM (AI messages, Tool Calls, and Tool Responses) are persisted in the ChatRoom's chat history.

## Startup And Globals
Global files which hold most of the global instances of items, and provides application startup.
  - `src/index.ts`: Application Entry
  - `src/app-globals.ts`: Defines most global services and provides the initialization function.
  - `src/plugin-type-resolvers.ts`: Contains global instances of Plugin Type Resolvers, which are responsible for hydrating/creating plugins references.
  - `src/setup-express`: Responsible for setting up express servers, and related services.
  - `src/setup-socket-services.ts`: Responsible for setting up socket.io services.
  - `app-config.json`: Holds the configuration for the application.


## Sockets (Socket.IO)
  - Socket.IO is used for certain asynchronous interactions with the client.

  - Specific Implementations:
    - The `SocketServer` is the primary service used for socket interaction.
      - Most other services use an instance of this for socket implementations.
      - Found at `src/server/socket.server.ts`
      - `SocketServiceBase` implementations use the `SocketServer` (as a dependency) for interaction, but does not implement sockets themselves.
      - Instantiated and referenced through the `src/app-globals.ts` file.
    - The `ChatRoomSocketServer` registers event handlers on the `ChatRoomService` to emit chat room message updates to clients.
      - Implements the `SocketServiceBase`.
    - `TextDocumentSocketService`: Sends immediate updates of text documents to clients when documents are changed.

## Database Services
  - All Database Services implement the `DbService` base class (`src/database/db-service.ts`).
  - The `MongoHelper` is the primary abstraction for MongoDB database interactions.  (`src/mongo-helper.ts`)
    - All Database Services use this implementation for database operations.
  - Use the `ChatRoomDbService` (`src/database/chat-core/chat-room-db.service.ts`) for pattern examples when creating new services or looking for applicable patterns.

## Node Servers
  - All Express servers are stored in the `src/server` folder.
  - Use the Chat Rooms Server (`src/server/chat-rooms.server.ts`) for pattern examples when writing server endpoints.
    
## Misc
  - The `ChatCoreService` (`src/services/chat-core.service.ts`) is the general service used to perform operations that span multiple top-level chat-based components.
    - For instance, deleting a chat room requires deleting owned instances of `ChatAgent`s and `ChatJob`s, which this service handles.
  - The `src/model` folder is where models are kept.
    - The `src/model/shared-models` folder is ONLY for models that are copied to the client project and back.
      - Models in this folder must be able to be implemented in a browser.
      - NOTE: Some libraries (i.e. `mongodb`) have special types implemented on the browser project to allow the use of those libraries between the two projects.
  - The type `ObjectId` is used in the server and the client.  A type alias for `ObjectId` is used on the client, making it a `string` type.
  - Folders named `chat-core` hold source files specific to chat and LLM functionality, and unique to the application's functionality.
  - Plugin Creation instructions are int he `.github/instructions/plugins.instructions.md` file.
    - Reference this file when updating or creating new plugins.
