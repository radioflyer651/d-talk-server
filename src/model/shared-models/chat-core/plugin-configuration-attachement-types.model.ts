import { PluginSpecification } from "./plugin-specification.model";

/** Types that can accept a plugin specification. */
export interface IPluginConfigurationAttachmentType {
    /** Gets or sets the sets of plugin specifications. */
    plugins: PluginSpecification[];
}