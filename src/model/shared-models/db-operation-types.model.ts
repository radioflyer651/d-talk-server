import { ObjectId } from "mongodb";

export type DbItem = { _id: ObjectId; };

export type NewDbItem<T extends DbItem> = Omit<T, '_id'>;

export type UpsertDbItem<T extends DbItem> = NewDbItem<T> & { _id?: ObjectId; };

/** Given a specified object, assuming it's of a certain DB Type, returns whether or not it has an _id,
 *   indicating whether or not it's a NewDbItem. */
export function isNewDbItem<T extends DbItem>(target: NewDbItem<T> | T): target is NewDbItem<T> {
    return !(target as any)._id;
}

/** Given a specified UpsertDbItem, returns whether or not the object is new, or an existing item (having an _id). */
export function isExistingDbItem<T extends DbItem>(target: UpsertDbItem<T>): target is T {
    return !!(target as any)._id;
}

/** Sets the ID of a specified new DB object, and returns the same object in the form of the non-new type. */
export function assignIdToInsertable<T extends DbItem>(target: NewDbItem<T>, newId: ObjectId): T {
    // Recast the target.
    const recast = target as unknown as { _id: ObjectId; } & T;

    // Set the ID, and return the object.
    recast._id = newId;

    return recast;
}