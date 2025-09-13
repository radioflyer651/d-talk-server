
export interface AwsBucketObjectReference {
    /** The bucket the object's stored in. */
    bucket: string;

    /** The key of the object. */
    key: string;

    /** Type of content that the blob holds. */
    contentType?: string;
}