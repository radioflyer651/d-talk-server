import { ObjectId } from "mongodb";


/** Given a set of ObjectId objects, returns only the unique values without duplicates. */
export function getDistinctObjectIds(objectIds: ObjectId[]): ObjectId[] {
    // Place to set unique values.
    const seen = new Set<string>();
    const distinct: ObjectId[] = [];

    for (const id of objectIds) {
        // Get the string value.
        const str = id.toHexString();

        // If it's new in the list, then add it to the results.
        if (!seen.has(str)) {
            seen.add(str);
            distinct.push(id);
        }
    }

    // Return the results.
    return distinct;
}