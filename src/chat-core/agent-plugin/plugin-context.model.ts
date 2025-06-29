import { ObjectId } from "mongodb";
import { PluginSpecification } from "./plugin-specification.model";

/** This is the data for a plugin instance. */
export interface PluginInstanceReference {
    _id: ObjectId;

    /** The plugin specification that this context data is for.
     *   NOTE: This is duplicated data from where ever the specification was defined. 
     *   This allows us to detect changes in the specification, and make updates as needed. */
    pluginSpecification: PluginSpecification;
}