import { ModelServiceParams } from "../model-service-params.model";

export interface AiActingInstructionsConfiguration {
    /** The configuration for the LLM model to use when generating acting instructions. */
    modelParams: ModelServiceParams;
    
    /** 0 or more instructions to help direct the agent to think before generating acting instructions. */
    modelInstructions: string[];

    /** When true, the system will NOT provide a final call to the LLM instructing it to provide acting instructions.
     *   In such a case you must provide the final instruction in your modelInstructions. */
    excludeFinalInstructionForActingResponse: boolean;
}