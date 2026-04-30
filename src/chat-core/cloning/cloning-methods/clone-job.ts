import { ObjectId } from 'mongodb';
import { ChatJobConfiguration } from '../../../model/shared-models/chat-core/chat-job-data.model';
import { NewDbItem } from '../../../model/shared-models/db-operation-types.model';
import { clonePluginSpecification } from './clone-plugin-specification';

/** Given a specified ChatJobConfiguration, returns a clone of it suitable for insertion as a new DB item. */
export function cloneJob(job: ChatJobConfiguration) {
    // Clone the job with the ID removed so it can be inserted as a new document.
    const { _id, ...newConfigurationRest } = job;
    const newConfiguration = structuredClone(newConfigurationRest) satisfies NewDbItem<ChatJobConfiguration>;

    // Update the instruction message IDs so they are unique for the cloned configuration.
    newConfiguration.instructions.forEach(message => {
        message._id = new ObjectId();
    });

    // Clone plugin specifications and assign new unique IDs for each specification.
    newConfiguration.plugins = job.plugins.map(p => clonePluginSpecification(p));

    // Return the new configuration without a database _id.
    return newConfiguration;
}

