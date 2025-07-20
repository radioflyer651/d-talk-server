import { PluginInstanceReference } from "../../../model/shared-models/chat-core/plugin-instance-reference.model";
import { PluginSpecification } from "../../../model/shared-models/chat-core/plugin-specification.model";
import { USER_MESSAGES_IGNORED_PLUGIN_TYPE_ID } from "../../../model/shared-models/chat-core/plugins/plugin-type-constants.data";
import { PluginAttachmentTarget } from "../../agent-plugin/agent-plugin-base.service";
import { IPluginTypeResolver } from "../../agent-plugin/i-plugin-type-resolver";
import { UserMessagesIgnoredPlugin } from "../plugins/user-messages-ignored.plugin";

export class UserMessagesIgnoredPluginResolver implements IPluginTypeResolver<UserMessagesIgnoredPlugin> {
    canImplementType(typeName: string): boolean {
        return typeName === USER_MESSAGES_IGNORED_PLUGIN_TYPE_ID;
    }

    async createNewPlugin(specification: PluginSpecification, attachedTo: PluginAttachmentTarget): Promise<UserMessagesIgnoredPlugin> {
        const result = new UserMessagesIgnoredPlugin(specification);
        result.attachedTo = attachedTo;
        return result;
    }

    async hydratePlugin(pluginInstance: PluginInstanceReference, attachedTo: PluginAttachmentTarget): Promise<UserMessagesIgnoredPlugin> {
        const result = new UserMessagesIgnoredPlugin(pluginInstance);
        result.attachedTo = attachedTo;
        return result;
    }
}
