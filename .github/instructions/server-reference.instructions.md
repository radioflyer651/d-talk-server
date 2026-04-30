---
applyTo: 'src/server/**/*.ts'
---

# Express Server Files

## Server files index by domain

This index summarizes each Express/server-side TypeScript file under `src/server` and the domain it serves. Use it to quickly locate endpoints, socket services, and middleware by area of responsibility.

### Authentication
- `src/server/auth.server.ts` — Login and registration endpoints; issues JWTs; validates credentials against `authDbService`.

### Projects
- `src/server/project.server.ts` — Project listings and CRUD; updates project knowledge; enforces ownership via `creatorId`.

### Chat rooms
- `src/server/chat-rooms.server.ts` — Chat room CRUD and management: agent instance attach/detach, job instance add/remove/reorder, conversation message update/delete/clear, room instructions and document permissions, list rooms by project.

### Chatting (message flow)
- `src/server/chatting.server.ts` — Accepts a user message for a chat room, validates access, and delegates to `chattingService` for LLM processing; returns LangChain stored messages.

### Agents
- `src/server/agent-configs.server.ts` — CRUD for Chat Agent Identity Configurations (project-level); toggle instruction/identity message disabled flag.
- `src/server/agent-instances.server.ts` — CRUD for Agent Instances; fetch by identity, by id, by chat room; assignable to chat jobs.

### Jobs (chat jobs/tasks)
- `src/server/jobs.server.ts` — CRUD for Chat Job Configurations; toggle instruction disabled; set messagesHidden; project access checks.

### Chat documents (knowledge/documents)
- `src/server/chat-documents.server.ts` — CRUD and listing for `IChatDocumentData`; validates project access; stamps audit fields and routes creation via `documentResolver`.

### Voice chat
- `src/server/voice-chat.server.ts` — Generates voice messages for chat content and lists available voices (Hume integration); permission-gated (`permissions.canUseVoice`).

### Model configuration
- `src/server/ollama-model-config.server.ts` — Admin-only CRUD for Ollama model configurations; lists all configs publicly; creates/updates/deletes gated by admin users.

### Socket infrastructure
- `src/server/socket.server.ts` — Socket.IO server wrapper: connection auth via JWT, event subscription helpers, room join/leave, broadcast helpers, and error reporting utilities.

### Socket services
- `src/server/socket-services/socket-server-base.socket-service.ts` — Base class for socket services; lifecycle and error reporting helpers.
- `src/server/socket-services/chat-room.socket-service.ts` — Chat room socket events: join/exit room, stream message chunks, broadcast message updates to room listeners.
- `src/server/socket-services/text-document.socket-service.ts` — Text document socket events: join/exit document room; validate access; persist content changes; broadcast changes.

### Middleware
- `src/server/middleware/body-object-ids-to-string.middleware.ts` — Wraps `res.json` to convert Mongo `ObjectId` values to strings in responses.
- `src/server/middleware/body-strings-to-object-ids.middleware.ts` — Converts request body string fields that look like ObjectIds into actual `ObjectId` values.
- `src/server/middleware/string-to-date-converters.middleware.ts` — Converts date-time strings in request bodies into `Date` objects (recursive).

### Admin
- `src/server/admin/admin.server.ts` — Admin router scaffold; gate all child routes by `isAdmin`.

## Notes
- Access control patterns:
	- Project-level resources enforce ownership via `projectDbService.getProjectById(...).creatorId`.
	- Chat room access typically allows owner or participant IDs.
	- Admin-only actions are enforced by checking `user.isAdmin` or specific permissions.
- Socket rooms are named via helpers (e.g., chat room/document room name getters) to ensure consistent broadcast targets.

