import { ObjectId } from "mongodb";


export interface LargeFile {
    _id: ObjectId;

    /** The name of the file. */
    name: string;

    /** A long-form description of the file. */
    description: string;

    /** Type of file.  Most likely text (or text-based) or PDF - possibly HTML. */
    fileType: string;

    /** Content of the file. */
    content: any;

    /** Text content of the file, which should be parsed/converted from the content property. */
    textContent: string;
}