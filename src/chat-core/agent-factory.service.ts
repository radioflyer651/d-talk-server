import { ObjectId } from "mongodb";
import { IPluginResolver } from "./agent-plugin/plugin-resolver.interface";
import { Agent } from "./agent/agent.service";
import { ModelServiceResolver } from "./agent/model-services/model-service-resolver";
import { ChatAgentIdentityConfiguration } from "../model/shared-models/chat-core/agent-configuration.model";
import { AgentInstanceConfiguration } from "../model/shared-models/chat-core/agent-instance-configuration.model";
import { AgentDbService } from "../database/chat-core/agent-db.service";
import { AgentInstanceDbService } from "../database/chat-core/agent-instance-db.service";


/** Responsible for taking an agent configuration, and returning an agent from it. */
export class AgentServiceFactory {
    constructor(
        readonly modelResolver: ModelServiceResolver,
        readonly pluginResolver: IPluginResolver,
        readonly agentDbService: AgentDbService,
        readonly agentInstanceDbService: AgentInstanceDbService,
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

        // Hydrate the plugins for this agent.
        configuration.plugins = configuration.plugins ?? [];
        const hydratedPlugins = await this.pluginResolver.hydrateAllPlugins(identity.plugins, configuration.plugins, agent, true);

        // If there are new plugins, then we need to update the agent instance in the database to record this new information.
        //  NOTE: The configuration.plugins property was updated in the previous call.
        if (hydratedPlugins.newPlugins.length > 0 || hydratedPlugins.pluginsRemoved) {
            await this.agentInstanceDbService.updateAgent(configuration._id, { plugins: configuration.plugins });
        }

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
            plugins: [],
            projectId: identity.projectId, // Ensure projectId is provided
        } as AgentInstanceConfiguration;

        // Create the agent.
        const agent = new Agent(configuration, identity, model);

        // Hydrate the plugins for this agent.
        const hydratedPlugins = await this.pluginResolver.hydrateAllPlugins(identity.plugins, configuration.plugins, agent, true);

        // If there are new plugins, then we need to update the agent instance in the database to record this new information.
        //  NOTE: The configuration.plugins property was updated in the previous call.
        if (hydratedPlugins.newPlugins.length > 0 || hydratedPlugins.pluginsRemoved) {
            await this.agentInstanceDbService.updateAgent(configuration._id, { plugins: configuration.plugins });
        }

        // Return the agent.
        return agent;
    }

}