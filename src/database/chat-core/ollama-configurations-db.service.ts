import { ObjectId } from "mongodb";
import { MongoHelper } from "../../mongo-helper";
import { DbService } from "../db-service";
import { OllamaModelConfiguration } from "../../model/shared-models/chat-core/chat-model-params/ollama.model-params";
import { DbCollectionNames } from "../../model/db-collection-names.constants";
import { UpsertDbItem } from "../../model/shared-models/db-operation-types.model";

/** DB Service for the OllamaModelConfiguration type. */
export class OllamaModelConfigurationDbService extends DbService {
    constructor(dbHelper: MongoHelper) {
        super(dbHelper);
    }

    /** Create or update an Ollama model configuration. */
    async upsertOllamaModelConfiguration(config: UpsertDbItem<OllamaModelConfiguration>): Promise<OllamaModelConfiguration> {
        return await this.dbHelper.upsertDataItem<OllamaModelConfiguration>(DbCollectionNames.OllamaModelConfigurations, config) as OllamaModelConfiguration;
    }

    /** Get an Ollama model configuration by its ObjectId. */
    async getOllamaModelConfigurationById(configId: ObjectId): Promise<OllamaModelConfiguration | undefined> {
        return await this.dbHelper.findDataItem<OllamaModelConfiguration, { _id: ObjectId; }>(
            DbCollectionNames.OllamaModelConfigurations,
            { _id: configId },
            { findOne: true }
        ) as OllamaModelConfiguration | undefined;
    }

    /** Get all Ollama model configurations. */
    async getAllOllamaModelConfigurations(): Promise<OllamaModelConfiguration[]> {
        return await this.dbHelper.findDataItem<OllamaModelConfiguration, {}>(
            DbCollectionNames.OllamaModelConfigurations,
            {}
        ) as OllamaModelConfiguration[];
    }

    /** Update an Ollama model configuration by its ObjectId. */
    async updateOllamaModelConfiguration(configId: ObjectId, update: Partial<OllamaModelConfiguration>): Promise<number> {
        return await this.dbHelper.updateDataItems<OllamaModelConfiguration>(
            DbCollectionNames.OllamaModelConfigurations,
            { _id: configId },
            update,
            { updateOne: true }
        );
    }

    /** Delete an Ollama model configuration by its ObjectId. */
    async deleteOllamaModelConfiguration(configId: ObjectId): Promise<number> {
        return await this.dbHelper.deleteDataItems<OllamaModelConfiguration, { _id: ObjectId; }>(
            DbCollectionNames.OllamaModelConfigurations,
            { _id: configId },
            { deleteMany: false }
        );
    }

}