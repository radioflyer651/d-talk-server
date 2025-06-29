import { ObjectId } from "mongodb";
import { AgentPluginBase } from "./agent-plugin-base.service";
import { IPluginResolver } from "./i-plugin-resolver.service";
import { PluginInstanceReference } from "./plugin-context.model";
import { PluginSpecification } from "./plugin-specification.model";

export class AppPluginResolver implements IPluginResolver {
    getPluginInstance(pluginContext: PluginInstanceReference): Promise<AgentPluginBase | undefined> {
        throw new Error("Method not implemented.");
    }

    async getPluginInstances(pluginReferences: PluginInstanceReference[]): Promise<AgentPluginBase[]> {
        const result = await (await Promise.all(pluginReferences.map(p => this.getPluginInstance(p))));

        // If we couldn't resolve any, then we probably have issues.
        if (result.some(x => !x)) {
            throw new Error(`Some plugins were unable to be resolved.`);
        }

        return result as AgentPluginBase[];
    }

    createPluginInstance(pluginReference: PluginSpecification): Promise<AgentPluginBase> {
        throw new Error("Method not implemented.");
    }

}


