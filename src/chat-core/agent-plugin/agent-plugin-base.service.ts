import { DynamicTool } from "@langchain/core/tools";
import { PositionableMessage } from "../agent/model/positionable-message.model";
import { PluginInstanceReference } from "./plugin-context.model";
import { ObjectId } from "mongodb";
import { PluginSpecification } from "./plugin-specification.model";


export type AgentPluginBaseParams = { specification?: PluginSpecification, _id?: ObjectId; };

/** Base class for agent plugins, providing basic lifecycle hooks and protocols. */
export abstract class AgentPluginBase<T = any> {
    constructor(
        params?: AgentPluginBaseParams
    ) {
        if (params) {
            this.specification = params.specification;
            if (params._id) {
                this._id = params._id;
            }
        }
    }

    /** Gets or sets the ObjectID of this plugin.  This ID is used for context data, if nothing else. */
    _id: ObjectId = new ObjectId();

    /** Returns the unique identifier of this plugin that can be used for reference. */
    abstract readonly type: string;

    /** Returns details to make the agent aware of for this plugin. */
    abstract readonly agentUserManual?: string;

    creationContext?: T;

    specification?: PluginSpecification;

    /** Returns a set of plugin messages to be placed in the chat history before calling the LLM. 
     *   The base class returns an empty set. */
    getChatMessages(): Promise<PositionableMessage[]> {
        return Promise.resolve([]);
    }

    /** Returns tools that can be called by the AI. 
     *   These are tools built into the application, and not external tools. */
    localTools(): Promise<DynamicTool[]> {
        return Promise.resolve([]);
    }

    /** Returns data that should be saved for context on this plugin. 
     *   This should be overridden by the subclass. */
    getPluginContextData(): any {
        return {};
    }

    /** Returns a reference to this plugin. */
    getReference(): PluginInstanceReference {
        if (!this.specification) {
            throw new Error(`Cannot create a plugin reference without a pluginSpecification.`);
        }
        
        return { _id: this._id, pluginSpecification: this.specification };
    }
}