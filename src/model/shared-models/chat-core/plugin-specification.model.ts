import { ObjectId } from "mongodb";

/** This type is used to indicate, on a configuration, that it requires a specific plugin.  When an instance of
 *   whatever it's attached to is created, a plugin instance must be instantiated (created or rehydrated) for this plugin specification. */
export interface PluginSpecification<T = any> {
    /** This is NOT a database ID, but just a unique identifier for this plugin specification, in relation
     *   to the other plugins on the configuration it's attached to.  That way, if 2 plugins of the same type is specified
     *   this ID is used to tell the difference between them (say a resume document and a cover letter document of the same plugin type) */
    id: ObjectId;

    /** The type of plugin this is referencing. */
    pluginType: string;

    /** Data for the plugin. For instance, we might be referencing a memory plugin,
     *   but need to indicate what type of memories the plugin should be creating/retrieving. */
    configuration: T;
}