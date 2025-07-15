

/** Common interface for cleaning up resources when the class is done being used. */
export interface IDisposable {

    /** Should be called when the consuming service/class is done with this type. */
    dispose(): void;
}
