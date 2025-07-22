import { BaseMessage } from "@langchain/core/messages";
import { getDtalkParams } from "../../model/shared-models/chat-core/utils/messages.utils";

/** Provides grouping of messages in a message list, based on tool statuses and ai messages. */
export class MessageGroupingState {
    constructor(
        readonly messages: BaseMessage[],
        readonly messageIndex: number,
    ) {
        this.message = messages[messageIndex];
    }

    readonly message: BaseMessage;

    get previousMessage(): BaseMessage | undefined {
        if (this.messageIndex < 1) {
            return undefined;
        }

        return this.messages[this.messageIndex - 1];
    }

    get messageType() {
        return this.message.getType();
    }

    get hasToolCalls() {
        return ((this.message as any).tool_calls?.length ?? 0 > 0);
    }

    get requiresTraversalBack(): boolean {
        const messageType = this.message.getType();
        const previousState = this.getPreviousMessageGrouping();

        // If there's no previous message, then we simply can't traverse backwards.  We're at the end.
        if (!previousState) {
            return false;
        }

        if (messageType === 'tool') {
            // Technically, this should always be true, but who knows...
            return previousState.messageType === 'ai' || previousState.messageType === 'tool';
        }

        if (messageType === 'ai') {
            return previousState.messageType === 'tool' || previousState.hasToolCalls;
        }

        return false;
    }

    get requiresTraversalForward(): boolean {
        const messageType = this.message.getType();
        const nextState = this.getNextMessageGrouping();

        // If there's no next message, then we simply can't traverse forwards.  We're at the end.
        if (!nextState) {
            return false;
        }

        // If the next message is a tool, then we don't care how it got there.  We'll delete it.
        if (nextState.messageType === 'tool') {
            return true;
        }

        if (messageType === 'tool') {
            return nextState.messageType === 'ai';
        }

        if (messageType === 'ai') {
            // Well... we've already checked the next message for 'tool', and returned, so that's not an option.
            //  If the next message isn't a tool...  We'll assume we're done regardless of the circumstances.
            return false;
        }

        // If this is any other kind of message (system or human), then...
        //  There's probably nothing else to do.  Tools are all taken care of.
        return false;

    }

    /** Finds the MessageGroupingState of the message with the lowest index related to this message. */
    getFirstRelatedMessage(): MessageGroupingState {
        // Check if we're done.  If we're done, then we're done!
        if (!this.requiresTraversalBack) {
            return this;
        }

        // We're not done.  We KNOW the previous message exists (because of the previous check),
        //  so let THAT ONE figure out who our mommy is.
        const previousState = this.getPreviousMessageGrouping();
        return previousState!.getFirstRelatedMessage();
    }

    /** Finds the MessageGroupingState of the message with the highest index related to this message. */
    getLastRelatedMessage(): MessageGroupingState {
        if (!this.requiresTraversalForward) {
            return this;
        }

        // We're not done.  We KNOW the next message exists (because of the previous check),
        //  so let THAT ONE figure out who our daddy is.
        const nextState = this.getNextMessageGrouping()!;
        return nextState.getLastRelatedMessage();
    }

    /** Returns a message grouping state for the previous message. */
    getPreviousMessageGrouping(): MessageGroupingState | undefined {
        const previousMessage = this.previousMessage;

        if (!previousMessage) {
            return undefined;
        }

        return new MessageGroupingState(this.messages, this.messageIndex - 1);
    }

    /** Returns a message grouping state for the next message. */
    getNextMessageGrouping(): MessageGroupingState | undefined {
        const nextMessage = this.messages[this.messageIndex + 1];

        if (!nextMessage) {
            return undefined;
        }

        return new MessageGroupingState(this.messages, this.messageIndex + 1);
    }

    /** Returns a boolean value indicating whether or not the next message is a tool message. */
    get isNextMessageToolCall(): boolean {
        const nextMessage = this.getNextMessageGrouping();
        if (!nextMessage) {
            return false;
        }

        return nextMessage.messageType === 'tool';
    }

    /** Returns a grouping state for all tool messages that come after this message. */
    getFollowingToolMessages(): MessageGroupingState[] {
        if (!this.isNextMessageToolCall) {
            return [];
        }

        // Get the next grouping, and let IT do the rest of the job for us.
        const nextGrouping = this.getNextMessageGrouping()!;
        const followingTools = nextGrouping.getFollowingToolMessages();
        return [nextGrouping, ...followingTools];
    }

    /** Returns a boolean value indicating whether or not this message is disabled, and meant
     *   not to be part of LLM chat calls. */
    get isDisabledMessage(): boolean {
        const data = getDtalkParams(this.message);
        return !!data.disabled;
    }

    /** Returns all tool messages directly after this message. */
    getToolMessagesFollowing(): MessageGroupingState[] {
        const nextGrouping = this.getNextMessageGrouping();

        if (nextGrouping && nextGrouping.messageType === 'tool') {
            return [nextGrouping, ...nextGrouping.getToolMessagesFollowing()];
        }

        return [];
    }
}