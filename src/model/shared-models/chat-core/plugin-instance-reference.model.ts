import { ObjectId } from "mongodb";
import { PluginSpecification } from "./plugin-specification.model";

/** This is the data for a plugin instance. For every "configuration" object with a plugin specification
 *   each instance of that configuration should have a plugin instance reference that matches a specification. */
export interface PluginInstanceReference<T = any> {
    /** This id is a reference to the data in the database storing arbitrary data for this instance of a plugin.
     *   The actual data is 100% defined by the plugin itself. */
    _id: ObjectId;

    /** The plugin specification that this context data is for.
     *   NOTE: This is duplicated data from where ever the specification was defined. 
     *   This allows us to detect changes in the specification, and make updates as needed. */
    pluginSpecification: PluginSpecification<T>;
}