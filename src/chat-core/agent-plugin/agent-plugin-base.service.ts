import { PluginInstanceReference } from "../../model/shared-models/chat-core/plugin-instance-reference.model";
import { ObjectId } from "mongodb";
import { PluginSpecification } from "../../model/shared-models/chat-core/plugin-specification.model";
import { IChatLifetimeContributor } from "../chat-lifetime-contributor.interface";
import { Agent } from "../agent/agent.service";
import { ChatRoom } from "../chat-room/chat-room.service";
import { ChatJob } from "../chat-room/chat-job.service";

// TODO: This type should be an interface, applied to the attachment target types themselves.
/** The types that a plugin can be attached to. */
export type PluginAttachmentTargetTypes = ChatRoom | Agent | ChatJob;

/** Base class for agent plugins, providing basic lifecycle hooks and protocols. */
export abstract class AgentPluginBase implements IChatLifetimeContributor {
    protected constructor(
        params: PluginInstanceReference | PluginSpecification
    ) {
        if ('pluginType' in params) {
            this.specification = params as PluginSpecification;
        } else {
            // Recast for typescript.
            const instance = params as PluginInstanceReference;
            this.specification = instance.pluginSpecification;
            this._id = instance._id;
        }
    }

    /** Gets or sets the target that this plugin is attached to.  Sometimes, this is needed
     *   for contextual reasons. */
    attachedTo?: PluginAttachmentTargetTypes;

    /** Gets or sets the ObjectID of this plugin.  This ID is used for context data, if nothing else. 
     *   We set the ID at initialization, since it won't be set by anything else.
    */
    _id: ObjectId = new ObjectId();

    /** Returns the unique identifier of this plugin that can be used for reference. */
    abstract readonly type: string;

    /** Returns details to make the agent aware of for this plugin. */
    abstract readonly agentUserManual?: string;

    /** Gets or sets agent whose turn it currently is.
     *   This is set by the chatroom. */
    agent!: Agent;

    /** Gets or sets the current chat room that the plugin
     *   is being called in. */
    chatRoom!: ChatRoom;

    /** Gets or sets the chat job that the current agent
     *   is speaking for. */
    chatJob!: ChatJob;

    specification?: PluginSpecification;

    /** Returns a reference to this plugin. */
    getReference(): PluginInstanceReference {
        if (!this.specification) {
            throw new Error(`Cannot create a plugin reference without a pluginSpecification.`);
        }

        return { _id: this._id, pluginSpecification: this.specification };
    }

    // We must implement at least one member of the IChatLifetimeContributor, or
    //  the compiler throws a fit.  If the plugin needs to initialize for chat
    //  then the subclass should absolutely override this call.
    async initialize(): Promise<void> {

    }
}