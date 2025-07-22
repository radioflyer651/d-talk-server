

/** Application-specific information stored on messages for application-specific usage. */
export interface ApplicationMessageInfo {
    /** Boolean value indicating whether or not the message is disabled, making it not included in LLM calls. */
    disabled?: boolean;
}