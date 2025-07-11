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
    async updateAgentIdentity(identityId: ObjectId, update: Partial<ChatAgentIdentityConfiguration>): Promise<number> {
        return await this.dbHelper.updateDataItems<ChatAgentIdentityConfiguration>(
            DbCollectionNames.AgentConfigurations,
            { _id: identityId },
            update,
            { updateOne: true }
        );
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
            { deleteMany: false }
        );
    }
}
