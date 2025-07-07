import { ObjectId } from "mongodb";
import { AgentPluginBase } from "./agent-plugin-base.service";
import { IPluginResolver } from "./plugin-resolver.interface";
import { PluginInstanceReference } from "../../model/shared-models/chat-core/plugin-instance-reference.model";
import { PluginSpecification } from "../../model/shared-models/chat-core/plugin-specification.model";

export class AppPluginResolver implements IPluginResolver {
    async getPluginInstance(pluginContext: PluginInstanceReference): Promise<AgentPluginBase | undefined> {
        console.error('AppPluginResolver not fully implemented');
        return undefined;
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
        console.error('AppPluginResolver not fully implemented');
        return {} as AgentPluginBase;
    }

}


