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

    /** Gets or sets the max context size for the LLM.  Default if 4096, based on Ollama defaults. */
    maxContext?: number;

    /** A display name for this configuration in dropdowns. */
    displayName: string;

    /** A description, if any, for this configuration. */
    description: string;

    /** Gets or sets the custom formatting for this configuration. */
    customFormatting: CustomChatFormatting;

    /** Boolean value indicating that thinking should be turned off, for thinking models. */
    disableThinking?: boolean;

    /** Boolean value indicating that only CPU should be used for this model. */
    cpuOnly?: boolean;
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