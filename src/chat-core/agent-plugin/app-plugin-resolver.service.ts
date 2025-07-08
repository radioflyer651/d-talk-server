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

    async getPluginInstance(pluginContext: PluginInstanceReference, attachedTo: PluginAttachmentTargetTypes): Promise<AgentPluginBase | undefined> {
        const resolver = this.getResolver(pluginContext.pluginSpecification.pluginType);

        // Get the plugins.
        const plugins = await resolver.hydratePlugin(pluginContext, attachedTo);

        // Set them on the target.
        attachedTo.plugins = plugins;

        // Return them.
        return plugins;
    }

    async getPluginInstances(pluginReferences: PluginInstanceReference[], attachedTo: PluginAttachmentTargetTypes): Promise<AgentPluginBase[]> {
        const result = await (await Promise.all(pluginReferences.map(p => this.getPluginInstance(p, attachedTo)))).filter(x => !!x);

        // Add these to the attachment target.
        attachedTo.plugins = result;

        // If we couldn't resolve any, then we probably have issues.
        if (result.some(x => !x)) {
            throw new Error(`Some plugins were unable to be resolved.`);
        }

        return result as AgentPluginBase[];
    }

    async createPluginInstance(pluginReference: PluginSpecification, attachmentTarget: PluginAttachmentTargetTypes, attachToAttachmentTarget: boolean): Promise<AgentPluginBase> {
        const resolver = this.getResolver(pluginReference.pluginType);

        // Return the instance of this.
        const result = await resolver.createNewPlugin(pluginReference.configuration, attachmentTarget);

        if (attachToAttachmentTarget && attachmentTarget.plugins) {
            attachmentTarget.plugins = [result];
        }

        return result;
    }

}


