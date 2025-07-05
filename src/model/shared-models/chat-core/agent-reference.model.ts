import { ObjectId } from "mongodb";

/** Provides a link between a specified agent configuration, and an instance of that configuration. 
 *   This allows, say a ChatRoom, to indicate that it needs a specific agent (by its config), and then
 *   have a specific instance created for that configuration. */
export interface AgentReference {
    identityId: ObjectId;
    instanceId: ObjectId;
}