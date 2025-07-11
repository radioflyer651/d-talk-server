import { ObjectId } from "mongodb";


export interface IgnoreSpecificAgentPluginParms {
    agentIds: ObjectId[];
}