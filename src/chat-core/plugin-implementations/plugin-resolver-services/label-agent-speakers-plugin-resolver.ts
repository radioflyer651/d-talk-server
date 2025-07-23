import { IPluginTypeResolver } from "../../agent-plugin/i-plugin-type-resolver";
import { LabelAgentSpeakersPlugin } from "../plugins/label-agent-speakers.plugin";
import { LABEL_AGENT_SPEAKERS_PLUGIN_TYPE_ID } from "../../../model/shared-models/chat-core/plugins/plugin-type-constants.data";
import { PluginInstanceReference } from "../../../model/shared-models/chat-core/plugin-instance-reference.model";
import { PluginSpecification } from "../../../model/shared-models/chat-core/plugin-specification.model";

export class LabelAgentSpeakersPluginResolver implements IPluginTypeResolver<LabelAgentSpeakersPlugin> {
    canImplementType(typeName: string): boolean {
        return typeName === LABEL_AGENT_SPEAKERS_PLUGIN_TYPE_ID;
    }

    async createNewPlugin(spec: PluginSpecification, attachedTo: any): Promise<LabelAgentSpeakersPlugin> {
        const result = new LabelAgentSpeakersPlugin(spec);
        result.attachedTo = attachedTo;
        return result;
    }

    async hydratePlugin(instance: PluginInstanceReference, attachedTo: any): Promise<LabelAgentSpeakersPlugin> {
        const result = new LabelAgentSpeakersPlugin(instance);
        result.attachedTo = attachedTo;
        return result;
    }
}
