import { MongoHelper } from "../../mongo-helper";
import { DbService } from "../db-service";
import { ObjectId } from "mongodb";
import { UpsertDbItem } from "../../model/shared-models/db-operation-types.model";
import { DbCollectionNames } from "../../model/db-collection-names.constants";
import { AgentInstanceConfiguration } from "../../model/shared-models/chat-core/agent-instance-configuration.model";
import { ChatAgentIdentityConfiguration } from "../../model/shared-models/chat-core/agent-configuration.model";

export class AgentDbService extends DbService {
    constructor(dbHelper: MongoHelper) {
        super(dbHelper);
    }

    /** Create or update an agent instance. */
    async upsertAgent(agent: UpsertDbItem<AgentInstanceConfiguration>): Promise<AgentInstanceConfiguration> {
        return await this.dbHelper.upsertDataItem<any>(DbCollectionNames.Users, agent) as AgentInstanceConfiguration;
    }

    /** Get an agent instance by its ObjectId. */
    async getAgentById(agentId: ObjectId): Promise<AgentInstanceConfiguration | undefined> {
        return await this.dbHelper.findDataItem<AgentInstanceConfiguration, { _id: ObjectId; }>(
            DbCollectionNames.Users,
            { _id: agentId },
            { findOne: true }
        ) as AgentInstanceConfiguration | undefined;
    }

    /** Get all agent instances for a given identity. */
    async getAgentsByIdentity(identityId: ObjectId): Promise<AgentInstanceConfiguration[]> {
        return await this.dbHelper.findDataItem<AgentInstanceConfiguration, { "identity._id": ObjectId; }>(
            DbCollectionNames.Users,
            { "identity._id": identityId }
        ) as AgentInstanceConfiguration[];
    }

    /** Update an agent instance by its ObjectId. */
    async updateAgent(agentId: ObjectId, update: Partial<AgentInstanceConfiguration>): Promise<number> {
        return await this.dbHelper.updateDataItems<AgentInstanceConfiguration>(
            DbCollectionNames.Users,
            { _id: agentId },
            update,
            { updateOne: true }
        );
    }

    /** Delete an agent instance by its ObjectId. */
    async deleteAgent(agentId: ObjectId): Promise<number> {
        return await this.dbHelper.deleteDataItems<AgentInstanceConfiguration, { _id: ObjectId; }>(
            DbCollectionNames.Users,
            { _id: agentId },
            { deleteMany: false }
        );
    }

    /** Get multiple agent instances by an array of ObjectIds. */
    async getAgentsByIds(agentIds: ObjectId[]): Promise<AgentInstanceConfiguration[]> {
        return await this.dbHelper.findDataItem<AgentInstanceConfiguration, { _id: { $in: ObjectId[]; }; }>(
            DbCollectionNames.Users,
            { _id: { $in: agentIds } }
        ) as AgentInstanceConfiguration[];
    }

    /** Create or update a chat agent identity configuration. */
    async upsertAgentIdentity(identity: UpsertDbItem<ChatAgentIdentityConfiguration & { _id: ObjectId }>): Promise<ChatAgentIdentityConfiguration & { _id: ObjectId }> {
        return await this.dbHelper.upsertDataItem<any>(DbCollectionNames.Users, identity) as ChatAgentIdentityConfiguration & { _id: ObjectId };
    }

    /** Get a chat agent identity configuration by its ObjectId. */
    async getAgentIdentityById(identityId: ObjectId): Promise<(ChatAgentIdentityConfiguration & { _id: ObjectId }) | undefined> {
        return await this.dbHelper.findDataItem<ChatAgentIdentityConfiguration & { _id: ObjectId }, { _id: ObjectId; }>(
            DbCollectionNames.Users,
            { _id: identityId },
            { findOne: true }
        ) as (ChatAgentIdentityConfiguration & { _id: ObjectId }) | undefined;
    }

    /** Get all agent identity configurations for a given project. */
    async getAgentIdentitiesByProject(projectId: ObjectId): Promise<(ChatAgentIdentityConfiguration & { _id: ObjectId })[]> {
        return await this.dbHelper.findDataItem<ChatAgentIdentityConfiguration & { _id: ObjectId }, { projectId: ObjectId; }>(
            DbCollectionNames.Users,
            { projectId }
        ) as (ChatAgentIdentityConfiguration & { _id: ObjectId })[];
    }

    /** Update a chat agent identity configuration by its ObjectId. */
    async updateAgentIdentity(identityId: ObjectId, update: Partial<ChatAgentIdentityConfiguration>): Promise<number> {
        return await this.dbHelper.updateDataItems<ChatAgentIdentityConfiguration & { _id: ObjectId }>(
            DbCollectionNames.Users,
            { _id: identityId },
            update,
            { updateOne: true }
        );
    }

    /** Delete a chat agent identity configuration by its ObjectId. */
    async deleteAgentIdentity(identityId: ObjectId): Promise<number> {
        return await this.dbHelper.deleteDataItems<ChatAgentIdentityConfiguration & { _id: ObjectId }, { _id: ObjectId; }>(
            DbCollectionNames.Users,
            { _id: identityId },
            { deleteMany: false }
        );
    }
}
