import { MongoHelper } from "../../mongo-helper";
import { DbService } from "../db-service";
import { ObjectId } from "mongodb";
import { UpsertDbItem } from "../../model/shared-models/db-operation-types.model";
import { DbCollectionNames } from "../../model/db-collection-names.constants";
import { ChatAgentIdentityConfiguration } from "../../model/shared-models/chat-core/agent-configuration.model";
import { PositionableMessage } from "../../model/shared-models/chat-core/positionable-message.model";
import { StoredMessage } from "@langchain/core/messages";
import { setMessageDisabledValue } from '../../model/shared-models/chat-core/utils/messages.utils';

export class AgentDbService extends DbService {
    constructor(dbHelper: MongoHelper) {
        super(dbHelper);
    }

    /** Create or update a chat agent identity configuration. */
    async upsertAgentIdentity(identity: UpsertDbItem<ChatAgentIdentityConfiguration>): Promise<ChatAgentIdentityConfiguration> {
        return await this.dbHelper.upsertDataItem<any>(DbCollectionNames.AgentConfigurations, identity) as ChatAgentIdentityConfiguration;
    }

    /** Get a chat agent identity configuration by its ObjectId. */
    async getAgentIdentityById(identityId: ObjectId): Promise<ChatAgentIdentityConfiguration | undefined> {
        return await this.dbHelper.findDataItem<ChatAgentIdentityConfiguration>(
            DbCollectionNames.AgentConfigurations,
            { _id: identityId },
            { findOne: true }
        ) as ChatAgentIdentityConfiguration | undefined;
    }

    /** Get multiple agent instances by an array of ObjectIds. */
    async getAgentIdentitiesByIds(agentIds: ObjectId[]): Promise<ChatAgentIdentityConfiguration[]> {
        return await this.dbHelper.findDataItem<ChatAgentIdentityConfiguration, { _id: { $in: ObjectId[]; }; }>(
            DbCollectionNames.AgentConfigurations,
            { _id: { $in: agentIds } }
        ) as ChatAgentIdentityConfiguration[];
    }


    /** Get all agent identity configurations for a given project. */
    async getAgentIdentitiesByProject(projectId: ObjectId): Promise<ChatAgentIdentityConfiguration[]> {
        return await this.dbHelper.findDataItem<ChatAgentIdentityConfiguration, { projectId: ObjectId; }>(
            DbCollectionNames.AgentConfigurations,
            { projectId }
        ) as ChatAgentIdentityConfiguration[];
    }

    /** Update a chat agent identity configuration by its ObjectId. */
    async updateAgentIdentity(identityId: ObjectId, update: Partial<ChatAgentIdentityConfiguration>): Promise<void> {
        await this.dbHelper.makeCallWithCollection(DbCollectionNames.AgentConfigurations, async (db, col) => {
            await col.replaceOne({ _id: identityId }, update);
        });

        // return await this.dbHelper.updateDataItems<ChatAgentIdentityConfiguration>(
        //     DbCollectionNames.AgentConfigurations,
        //     { _id: identityId },
        //     update,
        //     { updateOne: true }
        // );
    }

    /** Delete a chat agent identity configuration by its ObjectId. */
    async deleteAgentIdentity(identityId: ObjectId): Promise<number> {
        return await this.dbHelper.deleteDataItems<ChatAgentIdentityConfiguration>(
            DbCollectionNames.AgentConfigurations,
            { _id: identityId },
            { deleteMany: false }
        );
    }

    /** Delete a chat agent identity configuration by its ObjectId. */
    async deleteAgentIdentitiesByProjectId(projectId: ObjectId): Promise<number> {
        return await this.dbHelper.deleteDataItems<ChatAgentIdentityConfiguration>(
            DbCollectionNames.AgentConfigurations,
            { projectId: projectId },
            { deleteMany: true }
        );
    }

    /** Given a specified agent ID, sets the disabled property of an instruction or identity message's disabled property, given it's index in the respective list. */
    async setInstructionDisabled(agentId: ObjectId, messageType: 'instruction' | 'identity', messageIndex: number, newDisabledValue: boolean) {
        return await this.dbHelper.makeCallWithCollection<undefined, ChatAgentIdentityConfiguration>(DbCollectionNames.AgentConfigurations, async (db, collection) => {
            // Get the agent data.
            const agent = await collection.findOne({ _id: agentId });

            // If not found, then we have problems.
            if (!agent) {
                throw new Error(`Agent with the ID ${agentId} does not exist.`);
            }

            // Get the message from the appropriate list.
            let message: PositionableMessage<StoredMessage>;
            let messagePropertyName: string;
            if (messageType === 'identity') {
                message = agent.identityStatements[messageIndex];
                messagePropertyName = 'identityStatements';
            } else {
                message = agent.baseInstructions[messageIndex];
                messagePropertyName = 'baseInstructions';
            }

            // If not found, then we have problems.
            if (!message) {
                throw new Error(`Agent does not have a message with index ${messageIndex} in the ${messageType} list.`);
            }

            // Update the value.
            setMessageDisabledValue(message.message, newDisabledValue);

            // Save the value back.
            await collection.updateOne({ _id: agentId }, { $set: { [messagePropertyName]: (agent as any)[messagePropertyName] } });
        });
    }
}
