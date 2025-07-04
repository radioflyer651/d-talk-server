import { MongoHelper } from "../../mongo-helper";
import { DbService } from "../db-service";
import { ObjectId } from "mongodb";
import { UpsertDbItem } from "../../model/shared-models/db-operation-types.model";
import { DbCollectionNames } from "../../model/db-collection-names.constants";
import { PluginInstanceReference } from "../../model/shared-models/chat-core/plugin-instance-reference.model";
import { PluginSpecification } from "../../model/shared-models/chat-core/plugin-specification.model";

export class PluginDbService extends DbService {
    constructor(dbHelper: MongoHelper) {
        super(dbHelper);
    }

    // --- PluginSpecification CRUD ---
    async upsertPluginSpecification(spec: UpsertDbItem<PluginSpecification & { _id: ObjectId }>): Promise<PluginSpecification & { _id: ObjectId }> {
        return await this.dbHelper.upsertDataItem<any>(DbCollectionNames.Plugins, spec) as PluginSpecification & { _id: ObjectId };
    }

    async getPluginSpecificationById(id: ObjectId): Promise<(PluginSpecification & { _id: ObjectId }) | undefined> {
        return await this.dbHelper.findDataItem<PluginSpecification & { _id: ObjectId }, { _id: ObjectId; }>(
            DbCollectionNames.Plugins,
            { _id: id },
            { findOne: true }
        ) as (PluginSpecification & { _id: ObjectId }) | undefined;
    }

    async getPluginSpecificationsByType(pluginType: string): Promise<(PluginSpecification & { _id: ObjectId })[]> {
        return await this.dbHelper.findDataItem<PluginSpecification & { _id: ObjectId }, { pluginType: string; }>(
            DbCollectionNames.Plugins,
            { pluginType }
        ) as (PluginSpecification & { _id: ObjectId })[];
    }

    async updatePluginSpecification(id: ObjectId, update: Partial<PluginSpecification>): Promise<number> {
        return await this.dbHelper.updateDataItems<PluginSpecification & { _id: ObjectId }>(
            DbCollectionNames.Plugins,
            { _id: id },
            update,
            { updateOne: true }
        );
    }

    async deletePluginSpecification(id: ObjectId): Promise<number> {
        return await this.dbHelper.deleteDataItems<PluginSpecification & { _id: ObjectId }, { _id: ObjectId; }>(
            DbCollectionNames.Plugins,
            { _id: id },
            { deleteMany: false }
        );
    }

    // --- PluginInstanceReference CRUD ---
    async upsertPluginInstanceReference(ref: UpsertDbItem<PluginInstanceReference & { _id: ObjectId }>): Promise<PluginInstanceReference & { _id: ObjectId }> {
        return await this.dbHelper.upsertDataItem<any>(DbCollectionNames.Plugins, ref) as PluginInstanceReference & { _id: ObjectId };
    }

    async getPluginInstanceReferenceById(id: ObjectId): Promise<(PluginInstanceReference & { _id: ObjectId }) | undefined> {
        return await this.dbHelper.findDataItem<PluginInstanceReference & { _id: ObjectId }, { _id: ObjectId; }>(
            DbCollectionNames.Plugins,
            { _id: id },
            { findOne: true }
        ) as (PluginInstanceReference & { _id: ObjectId }) | undefined;
    }

    async getPluginInstanceReferencesByType(pluginType: string): Promise<(PluginInstanceReference & { _id: ObjectId })[]> {
        return await this.dbHelper.findDataItem<PluginInstanceReference & { _id: ObjectId }, { pluginType: string; }>(
            DbCollectionNames.Plugins,
            { pluginType }
        ) as (PluginInstanceReference & { _id: ObjectId })[];
    }

    async updatePluginInstanceReference(id: ObjectId, update: Partial<PluginInstanceReference>): Promise<number> {
        return await this.dbHelper.updateDataItems<PluginInstanceReference & { _id: ObjectId }>(
            DbCollectionNames.Plugins,
            { _id: id },
            update,
            { updateOne: true }
        );
    }

    async deletePluginInstanceReference(id: ObjectId): Promise<number> {
        return await this.dbHelper.deleteDataItems<PluginInstanceReference & { _id: ObjectId }, { _id: ObjectId; }>(
            DbCollectionNames.Plugins,
            { _id: id },
            { deleteMany: false }
        );
    }
}
