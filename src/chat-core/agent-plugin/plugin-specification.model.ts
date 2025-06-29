import { ObjectId } from "mongodb";


/** This type is used to specify a plugin to be used, but not instance data. */
export interface PluginSpecification<T = any> {
    /** A unique ID for this plugin reference.*/
    id: ObjectId;

    /** The type of plugin this is referencing. */
    pluginType: string;

    /** Data for the plugin. For instance, we might be referencing a memory plugin,
     *   but need to indicate what type of memories the plugin should be creating/retrieving. */
    configuration: T;
}