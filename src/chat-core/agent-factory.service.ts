import { ObjectId } from "mongodb";
import { IPluginResolver } from "./agent-plugin/plugin-resolver.interface";
import { Agent } from "./agent/agent.service";
import { ModelServiceResolver } from "./agent/model-services/model-service-resolver";
import { ChatAgentIdentityConfiguration } from "../model/shared-models/chat-core/agent-configuration.model";
import { AgentInstanceConfiguration } from "../model/shared-models/chat-core/agent-instance-configuration.model";
import { PluginInstanceReference } from "./agent-plugin/plugin-instance-reference.model";


/** Responsible for taking an agent configuration, and returning an agent from it. */
export class AgentServiceFactory {
    constructor(
        readonly modelResolver: ModelServiceResolver,
        readonly pluginResolver: IPluginResolver,
    ) {

    }

    async getAgent(configuration: AgentInstanceConfiguration): Promise<Agent> {
        const id = configuration.identity;

        // Get the model for this configuration.
        const model = await this.modelResolver.getModel(id.modelInfo);

        // Create the plugin instances.
        const allPlugins = [...configuration.instancePlugins, ...configuration.permanentPlugins];
        const pluginPromises = allPlugins
            .map(p => this.pluginResolver.getPluginInstance(p));
        const plugins = (await Promise.all(pluginPromises))
            .filter(p => !!p);

        // Return the agent.
        return new Agent(configuration, model, plugins);
    }

    /** Initializes and returns a new agent, giving a specified identity. */
    async createAgent(identity: ChatAgentIdentityConfiguration): Promise<Agent> {
        // Get the model.
        const model = await this.modelResolver.getModel(identity.modelInfo);

        // Create the plugins.
        const plugins = await Promise.all(identity.plugins
            .map(async p => this.pluginResolver.createPluginInstance(p)));


        // Create the configuration for the agent.
        const configuration = {
            _id: new ObjectId(),
            identity: identity,
            permanentPlugins: plugins.map(p => p.getReference()),
            instancePlugins: [],
        } as AgentInstanceConfiguration;

        // Create the agent, and return it.
        const result = new Agent(configuration, model, plugins);
        return result;
    }

}