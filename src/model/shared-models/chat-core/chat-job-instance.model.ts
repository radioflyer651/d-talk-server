import { ObjectId } from "mongodb";
import { PluginInstanceReference } from "./plugin-instance-reference.model";


export interface ChatJobInstance {
    /** This is just a unique identifier for this instance, and is NOT a database ID. */
    id: ObjectId;

    /** Gets or sets the ID of the configuration for this instance. */
    configurationId: ObjectId;

    /** References to plugins that were implemented by this chat job. */
    pluginReferences: PluginInstanceReference[];
}