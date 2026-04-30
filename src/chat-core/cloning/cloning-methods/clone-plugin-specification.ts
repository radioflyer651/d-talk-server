import { ObjectId } from "mongodb";
import { PluginSpecification } from "../../../model/shared-models/chat-core/plugin-specification.model";

/** Given a specified PluginSpecification, returns a clone of it. */
export function clonePluginSpecification(plugin: PluginSpecification): PluginSpecification {
    const result = structuredClone(plugin);
    result.id = new ObjectId();
    return result;
}