import { ObjectId } from 'mongodb';
import { ChatAgentIdentityConfiguration } from '../../../model/shared-models/chat-core/agent-configuration.model';
import { NewDbItem } from '../../../model/shared-models/db-operation-types.model';
import { clonePluginSpecification } from './clone-plugin-specification';

/** Given a specified ChatAgentIdentityConfiguration, returns a clone of it. */
export function cloneAgentIdentity(agent: ChatAgentIdentityConfiguration) {
    // Clone the agent with the ID removed.
    const { _id, ...newConfigurationRest } = agent;
    const newConfiguration = structuredClone(newConfigurationRest) satisfies NewDbItem<ChatAgentIdentityConfiguration>;

    // Update the instructions.
    newConfiguration.baseInstructions.forEach(message => {
        message._id = new ObjectId();
    });
    newConfiguration.identityStatements.forEach(message => {
        message._id = new ObjectId();
    });

    // Update the specifications.
    newConfiguration.plugins = agent.plugins.map(p => clonePluginSpecification(p));

    // Return the result.
    return newConfiguration;
}