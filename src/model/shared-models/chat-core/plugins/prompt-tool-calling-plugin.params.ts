export interface PromptToolCallingPluginConfiguration {
    /** Opening tag that wraps the tool call JSON block. */
    toolCallOpenTag: string;
    /** Closing tag that wraps the tool call JSON block. */
    toolCallCloseTag: string;
    /** Number of times to re-prompt the model if it produces a malformed tool call. */
    maxRetries: number;
    /** When true, a usage example is included in the injected prompt. */
    includeExamples: boolean;
}
