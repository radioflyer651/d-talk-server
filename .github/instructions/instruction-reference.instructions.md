---
applyTo: '**'
---

# Instruction Reference

This file serves as a central reference guide for all instruction files in the `.github/instructions/` directory. When working on different parts of the codebase, consult this reference to determine which instruction files are relevant and should be reviewed.

## General Guidelines

- **Always check applicable instruction files** before generating or modifying code in the relevant areas.
- **Multiple instruction files may apply** to a single file or task. Review all applicable instructions.
- **TypeScript standards apply to all TypeScript files** in the project unless explicitly overridden.

---

## Instruction Files Overview

### TypeScript Standards
**File:** `typescript-standards.instructions.md`  
**Applies To:** All TypeScript files (`**/*.ts`)  
**When to Reference:**
- Creating any new TypeScript file
- Modifying existing TypeScript code
- Reviewing code for standards compliance
- Writing classes, interfaces, functions, or any TypeScript constructs

**Key Topics Covered:**
- Control flow standards (if statements, blocks)
- Type usage and avoiding `any`
- Data type creation (interfaces vs classes)
- Code formatting and vertical whitespace
- Constructor placement
- Export conventions (no default exports)
- Commenting standards (inline, JSDoc, TODO conventions)

---

### Plugin Development
**File:** `plugins.instructions.md`  
**Applies To:** `src/chat-core/plugin-implementations/**`  
**When to Reference:**
- Creating a new plugin for chat agents, rooms, or jobs
- Modifying existing plugin implementations
- Creating or updating plugin resolvers
- Adding plugin configuration data models
- Implementing lifecycle hooks for plugins
- Creating tools for plugins to use

**Key Topics Covered:**
- Plugin architecture and base classes
- Lifecycle hooks and `IChatLifetimeContributor` interface
- Plugin type constants and registration
- Creating plugin resolvers
- Tool creation with LangChain and Zod schemas
- Configuration data models
- Priority settings for lifetime context

**Related Files to Modify:**
- `src/model/shared-models/chat-core/plugins/plugin-type-constants.data.ts` (plugin registration)
- `src/plugin-type-resolvers.ts` (resolver registration)
- `src/chat-core/plugin-implementations/plugins/` (plugin implementations)
- `src/chat-core/plugin-implementations/plugin-resolver-services/` (resolvers)

---

### Express Server Development
**File:** `server-reference.instructions.md`  
**Applies To:** `src/server/**/*.ts`  
**When to Reference:**
- Creating new Express endpoints or routes
- Modifying existing server files
- Understanding server architecture by domain
- Locating endpoints for specific features
- Working with socket services
- Implementing server middleware

**Key Topics Covered:**
- Server files organized by domain (auth, projects, chat rooms, agents, jobs, etc.)
- Authentication and JWT handling
- Chat room and chatting endpoints
- Agent and job configuration endpoints
- Document and voice chat endpoints
- Socket.IO infrastructure
- Middleware for data transformation

**Domains Covered:**
- Authentication (`auth.server.ts`)
- Projects (`project.server.ts`)
- Chat rooms (`chat-rooms.server.ts`)
- Chatting/messaging (`chatting.server.ts`)
- Agent configurations and instances (`agent-configs.server.ts`, `agent-instances.server.ts`)
- Jobs (`jobs.server.ts`)
- Documents (`chat-documents.server.ts`)
- Voice chat (`voice-chat.server.ts`)
- Model configuration (`ollama-model-config.server.ts`)
- Socket services and middleware

---

### RAG Documents Feature
**File:** `rag-documents.instructions.md`  
**Applies To:** Any file working with RAG (Retrieval-Augmented Generation) document functionality  
**When to Reference:**
- Implementing file upload and storage functionality
- Working with document chunking and embeddings
- Implementing vector search capabilities
- Adding support for new file types (PDF, text, source code)
- Integrating RAG documents into chat contexts

**Key Topics Covered:**
- RAG document objectives and architecture
- File type support (text, PDF, source code)
- Document chunking strategies
- Embedding vector storage
- Vector search implementation
- LLM context integration

**Important Note:**
- RAG Documents do NOT implement `IChatDocumentData` or generalized `ChatDocument` functionality
- This is a separate feature with its own architecture

---

## Quick Reference Matrix

| Task | Primary Instruction(s) | Secondary Instruction(s) |
|------|----------------------|-------------------------|
| Creating a new plugin | `plugins.instructions.md` | `typescript-standards.instructions.md` |
| Adding an Express endpoint | `server-reference.instructions.md` | `typescript-standards.instructions.md` |
| Implementing RAG features | `rag-documents.instructions.md` | `typescript-standards.instructions.md` |
| Writing any TypeScript code | `typescript-standards.instructions.md` | (Domain-specific file) |
| Creating plugin tools | `plugins.instructions.md` | `typescript-standards.instructions.md` |
| Socket service work | `server-reference.instructions.md` | `typescript-standards.instructions.md` |
| Database service work | (Main copilot-instructions.md) | `typescript-standards.instructions.md` |

---

## Best Practices for Using Instructions

1. **Read Before Writing:** Always review applicable instruction files before starting work.
2. **Check Multiple Files:** Many tasks span multiple domains; check all relevant instructions.
3. **Follow Standards First:** TypeScript standards apply universally unless explicitly overridden.
4. **Update Instructions:** If you discover gaps or outdated information, update the instruction files.
5. **Reference in Comments:** When implementing specific patterns from instructions, consider adding a comment referencing the relevant instruction file.

---

## Maintenance Notes

- Keep this reference file updated when new instruction files are added.
- Ensure the `applyTo` frontmatter in each instruction file accurately reflects its scope.
- Review and update instruction files when architectural patterns change.
- Add new domains or features to the Quick Reference Matrix as they're developed.
