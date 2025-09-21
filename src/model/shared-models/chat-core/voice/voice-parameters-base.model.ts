import { AiActingInstructionsConfiguration } from "./ai-acting-instructions-configuration.model";

export interface IVoiceParameters {
    /** Returns a string unique to the voice service that operates with these parameters. */
    parameterType: string;

    /** Provides AI assistance in determining the acting instructions. */
    aiActingInstructions?: AiActingInstructionsConfiguration;

    /** When set, provides acting instructions to the voice model that don't change. */
    staticActingInstructions?: string;
}