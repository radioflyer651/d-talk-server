import { MongoHelper } from "../../mongo-helper";
import { DbService } from "../db-service";
import { ObjectId } from "mongodb";
import { UpsertDbItem } from "../../model/shared-models/db-operation-types.model";
import { DbCollectionNames } from "../../model/db-collection-names.constants";
import { AgentInstanceConfiguration } from "../../model/shared-models/chat-core/agent-instance-configuration.model";
import { ChatAgentIdentityConfiguration } from "../../model/shared-models/chat-core/agent-configuration.model";

export class AgentInstanceDbService extends DbService {
    constructor(dbHelper: MongoHelper) {
        super(dbHelper);
    }

    /** Create or update an agent instance. */
    async upsertAgent(agent: UpsertDbItem<AgentInstanceConfiguration>): Promise<AgentInstanceConfiguration> {
        return await this.dbHelper.upsertDataItem<any>(DbCollectionNames.AgentInstances, agent) as AgentInstanceConfiguration;
    }

    /** Get an agent instance by its ObjectId. */
    async getAgentById(agentId: ObjectId): Promise<AgentInstanceConfiguration | undefined> {
        return await this.dbHelper.findDataItem<AgentInstanceConfiguration, { _id: ObjectId; }>(
            DbCollectionNames.AgentInstances,
            { _id: agentId },
            { findOne: true }
        ) as AgentInstanceConfiguration | undefined;
    }

    /** Get all agent instances for a given identity. */
    async getAgentInstancesByIdentity(identityId: ObjectId): Promise<AgentInstanceConfiguration[]> {
        return await this.dbHelper.findDataItem<AgentInstanceConfiguration, { "identity._id": ObjectId; }>(
            DbCollectionNames.AgentInstances,
            { "identity._id": identityId }
        ) as AgentInstanceConfiguration[];
    }

    /** Update an agent instance by its ObjectId. */
    async updateAgent(agentId: ObjectId, update: Partial<AgentInstanceConfiguration>): Promise<number> {
        return await this.dbHelper.updateDataItems<AgentInstanceConfiguration>(
            DbCollectionNames.AgentInstances,
            { _id: agentId },
            update,
            { updateOne: true }
        );
    }

    /** Delete an agent instance by its ObjectId. */
    async deleteAgent(agentId: ObjectId): Promise<number> {
        return await this.dbHelper.deleteDataItems<AgentInstanceConfiguration>(
            DbCollectionNames.AgentInstances,
            { _id: agentId },
            { deleteMany: false }
        );
    }

    async deleteAgentInstancesByProjectId(projectId: ObjectId): Promise<number> {
        return await this.dbHelper.deleteDataItems<AgentInstanceConfiguration>(
            DbCollectionNames.AgentInstances,
            { projectId: projectId },
            { deleteMany: false }
        );
    }

    /** Get multiple agent instances by an array of ObjectIds. */
    async getAgentInstancesByIds(agentIds: ObjectId[]): Promise<AgentInstanceConfiguration[]> {
        return await this.dbHelper.findDataItem<AgentInstanceConfiguration, { _id: { $in: ObjectId[]; }; }>(
            DbCollectionNames.AgentInstances,
            { _id: { $in: agentIds } }
        ) as AgentInstanceConfiguration[];
    }
}
