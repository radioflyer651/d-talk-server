import { ObjectId } from "mongodb";

/** Represents chunked file content (text) for a specified large file. */
export interface LargeFileChunk {
    _id: ObjectId;

    /** The ID of the LargeFile that this content was chunked from. */
    largeFileId: ObjectId;

    /** The embedding for vector search (RAG). */
    embedding: Array<number>;

    /** The "length" of the embedding vector. */
    norm: number;

    /** Name of the embedding model used for generating the embedding. */
    embeddingModel: string;

    /** Version of the embedding model used. */
    embeddingModelVersion: string;

    /** The string content of the chunk. */
    content: string;

    /** The date that this chunk was created. */
    createdDate: Date;
}