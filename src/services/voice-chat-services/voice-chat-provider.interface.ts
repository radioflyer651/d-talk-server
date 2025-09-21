import { IVoiceParameters } from "../../model/shared-models/chat-core/voice/voice-parameters-base.model";
import { AwsStoreTypes } from "../../model/shared-models/storeable-types.model";


export interface IVoiceChatProvider<T extends IVoiceParameters> {
    /** Returns a boolean value indicating whether or not this service type can handle a specified voice message type. */
    canHandleParameterType(typeName: string): boolean;

    getVoiceMessage(message: string, configuration: T, actingInstructions?: string): Promise<AwsStoreTypes | undefined>;
}