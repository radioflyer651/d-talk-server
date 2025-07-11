import { IPluginTypeResolver } from "../../agent-plugin/i-plugin-type-resolver";
import { LabelAgentSpeakersPlugin } from "../plugins/label-agent-speakers.plugin";
import { LABEL_AGENT_SPEAKERS_PLUGIN_TYPE_ID } from "../../../model/shared-models/chat-core/plugins/plugin-type-constants.data";

export class LabelAgentSpeakersPluginResolver implements IPluginTypeResolver<LabelAgentSpeakersPlugin> {
    canImplementType(typeName: string): boolean {
        return typeName === LABEL_AGENT_SPEAKERS_PLUGIN_TYPE_ID;
    }

    async createNewPlugin(spec: any, attachedTo: any): Promise<LabelAgentSpeakersPlugin> {
        return new LabelAgentSpeakersPlugin(attachedTo);
    }

    hydratePlugin(instance: any, attachedTo: any): LabelAgentSpeakersPlugin {
        return new LabelAgentSpeakersPlugin(attachedTo);
    }
}
