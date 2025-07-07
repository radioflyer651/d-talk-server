import { AgentPluginBase } from "./agent-plugin-base.service";
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
    
    async getPluginInstance(pluginContext: PluginInstanceReference): Promise<AgentPluginBase | undefined> {
        const resolver = this.getResolver(pluginContext.pluginSpecification.pluginType);

        // Return the instance of this.
        return resolver.hydratePlugin(pluginContext);
    }

    async getPluginInstances(pluginReferences: PluginInstanceReference[]): Promise<AgentPluginBase[]> {
        const result = await (await Promise.all(pluginReferences.map(p => this.getPluginInstance(p))));

        // If we couldn't resolve any, then we probably have issues.
        if (result.some(x => !x)) {
            throw new Error(`Some plugins were unable to be resolved.`);
        }

        return result as AgentPluginBase[];
    }

    async createPluginInstance(pluginReference: PluginSpecification): Promise<AgentPluginBase> {
        const resolver = this.getResolver(pluginReference.pluginType);

        // Return the instance of this.
        return resolver.createNewPlugin(pluginReference.configuration);
    }

}


