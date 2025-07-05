import { ObjectId } from "mongodb";
import { PluginSpecification } from "./plugin-specification.model";

/** This is the data for a plugin instance. */
export interface PluginInstanceReference {
    /** This id is a reference to the data in the database storing arbitrary data for this instance of a plugin.
     *   The actual data is 100% defined by the plugin itself. */
    _id: ObjectId;

    /** The plugin specification that this context data is for.
     *   NOTE: This is duplicated data from where ever the specification was defined. 
     *   This allows us to detect changes in the specification, and make updates as needed. */
    pluginSpecification: PluginSpecification;
}