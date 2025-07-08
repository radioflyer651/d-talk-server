import { AgentPluginBase, PluginAttachmentTargetTypes } from "./agent-plugin-base.service";
import { IPluginResolver } from "./plugin-resolver.interface";
import { PluginInstanceReference } from "../../model/shared-models/chat-core/plugin-instance-reference.model";
import { PluginSpecification } from "../../model/shared-models/chat-core/plugin-specification.model";
import { IPluginTypeResolver } from "./i-plugin-type-resolver";

export class AppPluginResolver implements IPluginResolver {
    constructor(
        protected readonly typeResolverServices: IPluginTypeResolver<any>[],
    ) {

    }

    private getResolver(pluginType: string): IPluginTypeResolver<any> {
        const resolver = this.typeResolverServices.find(r => r.canImplementType(pluginType));

        if (!resolver) {
            throw new Error(`No plugin resolver found for type: ${pluginType}`);
        }

        return resolver;
    }

    async getPluginInstance(pluginContext: PluginInstanceReference, attachedTo: PluginAttachmentTargetTypes, attachToAttachmentTarget: boolean): Promise<AgentPluginBase | undefined> {
        const resolver = this.getResolver(pluginContext.pluginSpecification.pluginType);

        // Get the plugins.
        const plugins = await resolver.hydratePlugin(pluginContext, attachedTo);

        // Set them on the target.
        if (attachToAttachmentTarget) {
            attachedTo.plugins = plugins;
        }

        // Return them.
        return plugins;
    }

    async getPluginInstances(pluginReferences: PluginInstanceReference[], attachedTo: PluginAttachmentTargetTypes, attachToAttachmentTarget: boolean): Promise<AgentPluginBase[]> {
        const result = await (await Promise.all(pluginReferences.map(p => this.getPluginInstance(p, attachedTo, false)))).filter(x => !!x);

        // Add these to the attachment target.
        // Set them on the target.
        if (attachToAttachmentTarget) {
            attachedTo.plugins = result;
        }

        // If we couldn't resolve any, then we probably have issues.
        if (result.some(x => !x)) {
            throw new Error(`Some plugins were unable to be resolved.`);
        }

        return result as AgentPluginBase[];
    }

    async createPluginInstance(pluginReference: PluginSpecification, attachmentTarget: PluginAttachmentTargetTypes, attachToAttachmentTarget: boolean): Promise<AgentPluginBase> {
        const resolver = this.getResolver(pluginReference.pluginType);

        // Return the instance of this.
        const result = await resolver.createNewPlugin(pluginReference, attachmentTarget);

        if (attachToAttachmentTarget && attachmentTarget.plugins) {
            attachmentTarget.plugins = [result];
        }

        return result;
    }

    /** Totally hydrates all plugins in a specified set of plugin specifications and instances.  If a plugin is not initialized yet, it will be, and will be added to the pluginInstances parameter.
     *   If indicated, the plugins will be added to the attachmentTarget's plugin list. */
    async hydrateAllPlugins(pluginReferences: PluginSpecification[], pluginInstances: PluginInstanceReference[], attachmentTarget: PluginAttachmentTargetTypes, attachToAttachmentTarget: boolean): Promise<{ newPlugins: AgentPluginBase[], existingPlugins: AgentPluginBase[]; pluginsRemoved: boolean; }> {
        // Find any plugin that hasn't been implemented yet.
        const missingPlugins = pluginReferences.filter(r => !pluginInstances.some(p => p.pluginSpecification.id.equals(r.id)));

        // Create the new plugin instances.
        let newPluginsPromises: Promise<AgentPluginBase>[] = [];
        if (missingPlugins.length > 0) {
            // Start the generation of the plugins.
            newPluginsPromises = missingPlugins.map(p => this.createPluginInstance(p, attachmentTarget, false));
        }

        // Find any plugins that should be removed, and remove them.
        const pluginsToRemove = pluginInstances.filter(p => !pluginReferences.some(r => r.id.equals(p.pluginSpecification.id)));
        const pluginsRemoved = pluginsToRemove.length > 0;
        pluginsToRemove.forEach(p => {
            const index = pluginInstances.indexOf(p);
            pluginInstances.splice(index, 1);
        });

        // Hydrate the existing plugins.
        let existingPluginsPromise: Promise<AgentPluginBase[]> = Promise.resolve([]);
        if (pluginInstances.length > 0) {
            existingPluginsPromise = this.getPluginInstances(pluginInstances, attachmentTarget, false);
        }

        // Wait for both promise sets to complete.
        const newPlugins = await Promise.all(newPluginsPromises);
        const existingPlugins = await existingPluginsPromise;

        // Combine them.
        const allPlugins = [...existingPlugins, ...newPlugins];

        // add any new plugins to the pluginInstances list.
        if (newPlugins.length > 0) {
            pluginInstances.push(...newPlugins.map(p => p.getReference()));
        }

        // Attach them to the target, if necessary.
        if (attachToAttachmentTarget) {
            attachmentTarget.plugins = allPlugins;
        }

        // Return the plugins.
        return {
            newPlugins,
            existingPlugins,
            pluginsRemoved
        };
    }
}


