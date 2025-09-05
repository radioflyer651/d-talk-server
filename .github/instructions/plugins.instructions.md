---
applyTo: 'src/chat-core/plugin-implementations/**'
---

## How Plugins Work

- **Base Class:** All plugins extend `AgentPluginBase` (`chat-core/agent-plugin/agent-plugin-base.service.ts`), which provides lifecycle hooks and context (such as the agent, chat room, and job).
- **Lifecycle Hooks:** Plugins can must  methods from `IChatLifetimeContributor` (`chat-core/chat-lifetime-contributor.interface.ts`) to participate in different stages of the chat process (e.g., `modifyCallMessages`, `addPreChatMessages`, `handleReply`, etc.).
  - This functionality is implementation-specific.
- **Attachment:** Plugins are attached to agents, chat rooms, or jobs. The `attachedTo` property provides context for the plugin.
  - This is set through the plugin's resolver service during creation or hydration.
- **Type Resolvers:** Each plugin type has a corresponding resolver (implementing `IPluginTypeResolver` in `chat-core/agent-plugin/i-plugin-type-resolver.ts`) that knows how to instantiate and hydrate plugins of that type.
- **Registration:** All plugin resolvers are registered in `plugin-type-resolvers.ts` (at the root of `src/`) and made available to the application via the `AppPluginResolver` (`chat-core/agent-plugin/app-plugin-resolver.service.ts`).
- **Configuration Data**: Some, but not all, plugins have configuration data.  When applicable, the model is located in the `src/model/shared-models/chat-core/plugins` folder.
- **Lifetime Context Order** A `priority` property of the type `LifetimeContributorPriorityTypes` is set on the plugin, and uses one of the values as defined in the `src/chat-core/lifetime-contributor-priorities.enum.ts` file.


## Creating New Plugins

1. **Configuration Data**
  - If the plugin requires a configuration type, then generate it in the `src/model/shared-models/chat-core/plugins` folder.

2.  **Plugin Name & Info**
  - Every plugin has a unique name, and string constant to identify itself in various places of the application.  This constant must be unique and is stored as a constant in the `plugin-type-constants.data.ts` file.
    - Add the name to the top of the `src/model/shared-models/chat-core/plugins/plugin-type-constants.data.ts` file with the other constants.
  - Add an entry into the `pluginInformation` array, in the `src/model/shared-models/chat-core/plugins/plugin-type-constants.data.ts` file, for the new plugin.
    - If the plugin has a configuration, then the `defaultParameterCreator` should return a new instance of that type with appropriate default values.  Otherwise, undefined should be returned.

Constant Example:
```typescript
export const MY_CUSTOM_PLUGIN_TYPE_ID = 'some-type-name-plugin';
```

`pluginInformation` Example:
```typescript
    // ...
    {
        pluginType: MY_CUSTOM_PLUGIN_TYPE_ID,
        displayName: 'The Name Of The Plugin',
        attachesToAgent: true,
        attachesToChatRoom: true,
        attachesToJob: true,
        description: 'A description of what plugin does.',
        defaultParameterCreator: () => ({someProperty: 'defaultValue'})
    },
    // ...
```

3. **Create New Plugin**
   - Extend `AgentPluginBase` (`chat-core/agent-plugin/agent-plugin-base.service.ts`).
   - Implement any relevant lifecycle methods from `IChatLifetimeContributor` (`chat-core/chat-lifetime-contributor.interface.ts`).
   - Set the `type` property to a unique string constant from the previous step.
   - Place your plugin in `chat-core/plugin-implementations/plugins/`.
   - Note that `PluginInstanceReference` and `PluginSpecification` are generic.  If the plugin has a configuration type, then these references should use that type for their generic parameter.  Otherwise, don't set the generic parameter, and it will default to `any`.
   - If appropriate instructions are known to provide chat agents on how to use the plugin, then set the `agentUserManual` property with those instructions.  Otherwise, leave it unset, but defined for easy access later.

   ```typescript
   export class MyCustomPlugin extends AgentPluginBase {
      constructor(
         params: PluginInstanceReference<CONFIG_TYPE_NAME> | PluginSpecification<CONFIG_TYPE_NAME>
      ) {
         super(params);
      }
   
      agentUserManual?: string | undefined;
      readonly type = MY_CUSTOM_PLUGIN_TYPE_ID;

      declare specification: PluginSpecification<CONFIG_TYPE_NAME>;
      
      priority: LifetimeContributorPriorityTypes = LifetimeContributorPriorityTypes.Normal;

      // ...implement lifecycle methods as needed...
   }
   ```

4. **Create Plugin Resolver**
   - Implement `IPluginTypeResolver` for your plugin (`chat-core/agent-plugin/i-plugin-type-resolver.ts`).
   - Implement `canImplementType`, `createNewPlugin`, and `hydratePlugin`.
   - Place your resolver in `chat-core/plugin-implementations/plugin-resolver-services/`.

   ```typescript
   export class MyCustomPluginResolver implements IPluginTypeResolver<MyCustomPlugin> {    
    canImplementType(typeName: string): boolean {
        return typeName === MY_CUSTOM_PLUGIN_TYPE_ID;
    }

    async createNewPlugin(specification: PluginSpecification<CONFIG_TYPE_NAME>, attachedTo: PluginAttachmentTarget): Promise<MyCustomPlugin> {
        const result = new MyCustomPlugin(specification);
        result.attachedTo = attachedTo;
        return result;
    }

    async hydratePlugin(pluginInstance: PluginInstanceReference<CONFIG_TYPE_NAME>, attachedTo: PluginAttachmentTarget): Promise<MyCustomPlugin> {
        const result = new MyCustomPlugin(pluginInstance);
        result.attachedTo = attachedTo;
        return result;
    }
   }
   ```
   
5. **Register the Resolver**
   - Add your resolver to the `pluginTypeResolvers` array in `plugin-type-resolvers.ts` (at the root of `src/`).

   ```typescript
   import { MyCustomPluginResolver } from "./chat-core/plugin-implementations/plugin-resolver-services/my-custom-plugin-resolver";
   // ...
   export const pluginTypeResolvers = [
       // ...other resolvers...
       new MyCustomPluginResolver(),
   ];
   ```

## Example Plugins

- **RoomInfoPlugin:** (`chat-core/plugin-implementations/plugins/room-info.plugin.ts`) Adds a system message listing other agents in the room.
- **OtherAgentsInvisiblePlugin:** (`chat-core/plugin-implementations/plugins/other-agents-invisible.plugin.ts`) Filters out messages from other agents before the chat call.

See the `plugins/` and `plugin-resolver-services/` directories for more examples.

## Tools
  - When multiple tools are returned, be sure things are organized.
  - If needed, it's possible to create several methods to generate different tools, and return them as an array.
  - If there are a lot of tools (4 or more), generate a new file to create those tools, and reference that.
  - When creating tools, use the following format as a template for a single tool.

```typescript
import { z } from "zod";
import { StructuredToolInterface, tool } from "@langchain/core/tools";
// ...
    getTools() {
      const toolSchema = {
          name: 'tool_name',
          description: `A complete description of what the tool does.`,
          schema: z.object({
              parameter1: z.string().describe(`This is what the first parameter does.`),
              parameter2: z.number().int().describe(`This is what the second parameter does.`)
          })
      };

      return [
        tool(
          async (options: z.infer<typeof toolSchema.schema>) => {
            // Logic of the function.  Something must always be returned.
            //  If no actual return value is needed, then return a string indicating the success (or failure) of the operation.
          },
          toolSchema
        )
      ]
    }

```