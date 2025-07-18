import { ObjectId } from "mongodb";
import { CustomChatFormatting, ModelServiceParams } from "../model-service-params.model";
import { NewDbItem } from "../../db-operation-types.model";

export interface OllamaModelParams extends ModelServiceParams<OllamaModelServiceParams> {
    llmService: 'ollama';
}

export interface OllamaModelServiceParams {
    modelId: ObjectId;
    numPredict?: number;
    temperature?: number;
    keepAlive?: string | number; // default 5m.
    format?: string;
}

export interface OllamaModelConfiguration {
    /** The database ID of this model configuration. */
    _id: ObjectId;

    /** The actual name of the model. */
    modelName: string;

    /** A display name for this configuration in dropdowns. */
    displayName: string;

    /** A description, if any, for this configuration. */
    description: string;

    /** Gets or sets the custom formattinf for this configuration. */
    customFormatting: CustomChatFormatting;
}

export function createOllamaConfiguration(): NewDbItem<OllamaModelConfiguration> {
    function createFormatItem() {
        return {
            openDelimiter: '',
            closeDelimiter: '',
        };
    }

    return {
        modelName: '',
        displayName: '',
        description: '',
        customFormatting: {
            systemMarkers: createFormatItem(),
            userMarkers: createFormatItem(),
            aiMarkers: createFormatItem(),
        }
    };
}