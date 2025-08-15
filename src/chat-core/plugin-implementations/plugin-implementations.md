# Plugin System Overview

The plugin system allows you to extend chat agent and chat room functionality by implementing modular, attachable plugins. Plugins can modify message flows, add system messages, provide tools, or otherwise participate in the chat lifecycle.

## How Plugins Work

- **Base Class:** All plugins extend `AgentPluginBase` (`chat-core/agent-plugin/agent-plugin-base.service.ts`), which provides lifecycle hooks and context (such as the agent, chat room, and job).
- **Lifecycle Hooks:** Plugins can implement methods from `IChatLifetimeContributor` (`chat-core/chat-lifetime-contributor.interface.ts`) to participate in different stages of the chat process (e.g., `modifyCallMessages`, `addPreChatMessages`, `handleReply`, etc.).
- **Attachment:** Plugins are attached to agents, chat rooms, or jobs. The `attachedTo` property provides context for the plugin.
- **Type Resolvers:** Each plugin type has a corresponding resolver (implementing `IPluginTypeResolver` in `chat-core/agent-plugin/i-plugin-type-resolver.ts`) that knows how to instantiate and hydrate plugins of that type.
- **Registration:** All plugin resolvers are registered in `plugin-type-resolvers.ts` (at the root of `src/`) and made available to the application via the `AppPluginResolver` (`chat-core/agent-plugin/app-plugin-resolver.service.ts`).

## Creating a New Plugin

1. **Create the Plugin Class**
   - Extend `AgentPluginBase` (`chat-core/agent-plugin/agent-plugin-base.service.ts`).
   - Implement any relevant lifecycle methods from `IChatLifetimeContributor` (`chat-core/chat-lifetime-contributor.interface.ts`).
   - Set the `type` property to a unique string constant (see `model/shared-models/chat-core/plugins/plugin-type-constants.data.ts`).
   - Place your plugin in `chat-core/plugin-implementations/plugins/`.

   ```typescript
   export class MyCustomPlugin extends AgentPluginBase {
      constructor(
         params: PluginInstanceReference | PluginSpecification
      ) {
         super(params);
      }
   
      agentUserManual?: string | undefined;
      readonly type = MY_CUSTOM_PLUGIN_TYPE_ID;
      // ...implement lifecycle methods as needed...
   }
   ```

2. **Create a Plugin Resolver**
   - Implement `IPluginTypeResolver` for your plugin (`chat-core/agent-plugin/i-plugin-type-resolver.ts`).
   - Implement `canImplementType`, `createNewPlugin`, and `hydratePlugin`.
   - Place your resolver in `chat-core/plugin-implementations/plugin-resolver-services/`.

   ```typescript
   export class MyCustomPluginResolver implements IPluginTypeResolver<MyCustomPlugin> {
       canImplementType(typeName: string): boolean {
           return typeName === MY_CUSTOM_PLUGIN_TYPE_ID;
       }
       async createNewPlugin(spec: PluginSpecification, attachedTo: PluginAttachmentTarget) { /* ... */ }
       async hydratePlugin(instance: PluginInstanceReference, attachedTo: PluginAttachmentTarget) { /* ... */ }
   }
   ```

3. **Register the Resolver**
   - Add your resolver to the `pluginTypeResolvers` array in `plugin-type-resolvers.ts` (at the root of `src/`).

   ```typescript
   import { MyCustomPluginResolver } from "./chat-core/plugin-implementations/plugin-resolver-services/my-custom-plugin-resolver";
   // ...
   export const pluginTypeResolvers = [
       // ...other resolvers...
       new MyCustomPluginResolver(),
   ];
   ```

4. **Define Plugin Type Constants**
   - Add a unique string constant for your plugin type in `model/shared-models/chat-core/plugins/plugin-type-constants.data.ts`.

5. **(Optional) Add Plugin Specification/Instance Models**
   - If your plugin needs custom configuration, extend the plugin specification or instance models as needed (see `model/shared-models/chat-core/plugin-specification.model.ts` and `plugin-instance-reference.model.ts`).

## Example Plugins

- **RoomInfoPlugin:** (`chat-core/plugin-implementations/plugins/room-info.plugin.ts`) Adds a system message listing other agents in the room.
- **OtherAgentsInvisiblePlugin:** (`chat-core/plugin-implementations/plugins/other-agents-invisible.plugin.ts`) Filters out messages from other agents before the chat call.

See the `plugins/` and `plugin-resolver-services/` directories for more examples.

