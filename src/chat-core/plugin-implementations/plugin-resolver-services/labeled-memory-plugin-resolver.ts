import { IPluginTypeResolver } from "../../agent-plugin/i-plugin-type-resolver";
import { LabeledMemoryPlugin } from "../plugins/labeled-memory-plugin/labeled-memory.plugin";
import { LABELED_MEMORY_PLUGIN_TYPE_ID } from "../../../model/shared-models/chat-core/plugins/plugin-type-constants.data";
import { PluginAttachmentTarget } from "../../agent-plugin/agent-plugin-base.service";
import { PluginInstanceReference } from "../../../model/shared-models/chat-core/plugin-instance-reference.model";
import { PluginSpecification } from "../../../model/shared-models/chat-core/plugin-specification.model";
import { MongoHelper } from "../../../mongo-helper";
import { LabeledMemoryPluginParams, validateLabeledMemoryPluginParams } from "../../../model/shared-models/chat-core/plugins/labeled-memory-plugin.params";
import { MongoDbStore } from "../../../services/lang-chain/mongo-store.service";
import { ModelServiceResolver } from "../../agent/model-services/model-service-resolver";

export class LabeledMemoryPluginResolver implements IPluginTypeResolver<LabeledMemoryPlugin> {
    constructor(
        readonly dbHelper: MongoHelper,
        readonly chatModelResolver: ModelServiceResolver,
    ) {

    }

    canImplementType(typeName: string): boolean {
        return typeName === LABELED_MEMORY_PLUGIN_TYPE_ID;
    }

    /** Validates a specified LabeledMemoryPluginParams object, and throws an error if they are invalid. */
    private validateParams(params: LabeledMemoryPluginParams) {
        // Get the validation errors, if there are any.
        const validationIssues = validateLabeledMemoryPluginParams(params);

        // Generate an error if there are issues.
        if (validationIssues) {
            throw new Error(`LabeledMemoryPluginParams are invalid:\n${validationIssues.join('\n')}`);
        }
    }

    private async createChatModelForPlugin(spec: LabeledMemoryPluginParams) {
        return await this.chatModelResolver.getModel(spec.modelServiceParams);
    }

    async createNewPlugin(specification: PluginSpecification<LabeledMemoryPluginParams>, attachedTo: PluginAttachmentTarget): Promise<LabeledMemoryPlugin> {
        const config = specification.configuration;

        this.validateParams(config);
        const model = await this.createChatModelForPlugin(config);

        const result = new LabeledMemoryPlugin(
            specification,
            new MongoDbStore(config.memoryCollectionName, this.dbHelper),
            model,
        );

        result.attachedTo = attachedTo;
        return result;
    }

    async hydratePlugin(instance: PluginInstanceReference<LabeledMemoryPluginParams>, attachedTo: PluginAttachmentTarget): Promise<LabeledMemoryPlugin> {
        const config = instance.pluginSpecification.configuration;

        this.validateParams(config);
        const model = await this.createChatModelForPlugin(config);

        const result = new LabeledMemoryPlugin(
            instance,
            new MongoDbStore(config.memoryCollectionName, this.dbHelper),
            model,
        );

        result.attachedTo = attachedTo;
        return result;
    }

}
