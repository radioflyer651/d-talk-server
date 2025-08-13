// LabeledMemory2PluginResolver stub
import { IPluginTypeResolver } from '../../agent-plugin/i-plugin-type-resolver';
import { LabeledMemory2Plugin } from '../plugins/labeled-memory2.plugin';
import { LABELED_MEMORY2_PLUGIN_TYPE_ID } from '../../../model/shared-models/chat-core/plugins/plugin-type-constants.data';
import { PluginInstanceReference } from '../../../model/shared-models/chat-core/plugin-instance-reference.model';
import { LabeledMemory2PluginParams, validateLabeledMemory2PluginParams } from '../../../model/shared-models/chat-core/plugins/labeled-memory-plugin2.params';
import { PluginAttachmentTarget } from '../../agent-plugin/agent-plugin-base.service';
import { PluginSpecification } from '../../../model/shared-models/chat-core/plugin-specification.model';
import { MongoHelper } from '../../../mongo-helper';
import { MongoDbStore } from '../../../services/lang-chain/mongo-store.service';
import { ModelServiceResolver } from '../../agent/model-services/model-service-resolver';
import { LabeledMemoryPlugin } from '../plugins/labeled-memory-plugin/labeled-memory.plugin';

export class LabeledMemory2PluginResolver implements IPluginTypeResolver<LabeledMemory2Plugin> {
    constructor(
        readonly dbHelper: MongoHelper,
        readonly chatModelResolver: ModelServiceResolver,
    ) {

    }

    canImplementType(typeName: string): boolean {
        return typeName === LABELED_MEMORY2_PLUGIN_TYPE_ID;
    }

    /** Validates a specified LabeledMemoryPluginParams object, and throws an error if they are invalid. */
    private validateParams(params: LabeledMemory2PluginParams) {
        // Get the validation errors, if there are any.
        const validationIssues = validateLabeledMemory2PluginParams(params);

        // Generate an error if there are issues.
        if (validationIssues) {
            throw new Error(`LabeledMemory2PluginParams are invalid:\n${validationIssues.join('\n')}`);
        }
    }

    private async createChatModelForPlugin(spec: LabeledMemory2PluginParams) {
        return await this.chatModelResolver.getModel(spec.modelServiceParams);
    }

    async createNewPlugin(specification: PluginSpecification<LabeledMemory2PluginParams>, attachedTo: PluginAttachmentTarget): Promise<LabeledMemory2Plugin> {
        const config = specification.configuration;

        this.validateParams(config);
        const model = await this.createChatModelForPlugin(config);

        const result = new LabeledMemory2Plugin(
            specification,
            new MongoDbStore(config.memoryCollectionName, this.dbHelper),
            model,
        );

        result.attachedTo = attachedTo;
        return result;
    }

    async hydratePlugin(instance: PluginInstanceReference<LabeledMemory2PluginParams>, attachedTo: PluginAttachmentTarget): Promise<LabeledMemory2Plugin> {
        const config = instance.pluginSpecification.configuration;

        this.validateParams(config);
        const model = await this.createChatModelForPlugin(config);

        const result = new LabeledMemory2Plugin(
            instance,
            new MongoDbStore(config.memoryCollectionName, this.dbHelper),
            model,
        );

        result.attachedTo = attachedTo;
        return result;
    }
}
