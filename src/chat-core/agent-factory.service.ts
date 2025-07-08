import { ObjectId } from "mongodb";
import { IPluginResolver } from "./agent-plugin/plugin-resolver.interface";
import { Agent } from "./agent/agent.service";
import { ModelServiceResolver } from "./agent/model-services/model-service-resolver";
import { ChatAgentIdentityConfiguration } from "../model/shared-models/chat-core/agent-configuration.model";
import { AgentInstanceConfiguration } from "../model/shared-models/chat-core/agent-instance-configuration.model";
import { AgentDbService } from "../database/chat-core/agent-db.service";


/** Responsible for taking an agent configuration, and returning an agent from it. */
export class AgentServiceFactory {
    constructor(
        readonly modelResolver: ModelServiceResolver,
        readonly pluginResolver: IPluginResolver,
        readonly agentDbService: AgentDbService,
    ) {

    }

    async getAgent(configuration: AgentInstanceConfiguration): Promise<Agent> {
        // Get the identity configuration.
        const identity = await this.agentDbService.getAgentIdentityById(configuration.identity);

        // If now found - we have problems.
        if (!identity) {
            throw new Error(`No agent identity configuration was found for id: ${configuration.identity}`);
        }

        // Get the model for this configuration.
        const model = await this.modelResolver.getModel(identity.modelInfo);

        // Create the agent.
        const agent = new Agent(configuration, identity, model);

        // Create the plugin instances.
        const allPlugins = [...configuration.instancePlugins, ...configuration.permanentPlugins];
        const pluginPromises = allPlugins
            .map(p => this.pluginResolver.getPluginInstance(p, agent));
        const plugins = (await Promise.all(pluginPromises))
            .filter(p => !!p);

        agent.plugins = plugins;

        // Return the agent.
        return agent;
    }

    /** Initializes and returns a new agent, giving a specified identity. */
    async createAgent(identity: ChatAgentIdentityConfiguration): Promise<Agent> {
        // Get the model.
        const model = await this.modelResolver.getModel(identity.modelInfo);

        // Create the configuration for the agent.
        const configuration = {
            _id: new ObjectId(),
            identity: identity._id,
            permanentPlugins: [],
            instancePlugins: [],
            projectId: identity.projectId, // Ensure projectId is provided
        } as AgentInstanceConfiguration;

        // Create the agent.
        const agent = new Agent(configuration, identity, model);

        // Create the plugins.
        const plugins = await Promise.all(identity.plugins
            .map(async p => this.pluginResolver.createPluginInstance(p, agent, false)));

        // Set the references on the agent.
        configuration.permanentPlugins = plugins.map(p => p.getReference());

        // Place the plugins on the agent.
        agent.plugins = plugins;

        // Return the agent.
        return agent;
    }

}