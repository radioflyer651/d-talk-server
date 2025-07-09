import { ObjectId } from "mongodb";


/** Converts any ObjectId property, or nested property, of a specified target to a string.
 *   If the target is not an object, then it is returned as-is.  If it's an ObjectId itself
 *   then it is converted to a string. */
export function objectIdToStringConverter(target: any) {
    // If this isn't an object, then we can't convert it.
    if (!target || typeof target !== "object") {
        return target;
    }

    // If the value is an ObjectID, convert and return it.
    if (target instanceof ObjectId) {
        return target.toHexString();
    }

    // Unless indicated otherwise, clone the object so we don't modify the original.
    let obj = target;

    // Examine each property.
    for (let prop in obj) {
        // Get the value, and the type.
        const value = obj[prop];
        const type = typeof value;

        // We're being lazy here...  But - what can I say?  It's a personal project.
        try {
            if (value instanceof ObjectId) {
                // If this is an object ID, then convert it to a string.
                obj[prop] = value.toHexString();

            } else if (Array.isArray(value)) {
                // If this is an array, then recurse.  No need to clone,
                //  as we're already cloning the parent.
                obj[prop] = value.map(v => objectIdToStringConverter(v));

            } else if (type === "object") {
                // If this is an object, then recurse.  No need to clone,
                //  as we're already cloning the parent.
                obj[prop] = objectIdToStringConverter(value);

            } else {
                // Otherwise, do nothing - this is a primitive type.
            }
        } catch (err) {
            console.warn(`Error while converting ObjectIds: `, err);
        }
    }

    // Return the new object.
    return obj;
}

/** Converts any string property, or nested property, of a specified target to an ObjectId.
 *   If the target is not an object, then it is returned as-is.  If it's a string that is a valid
 *   ObjectId, then it is converted to an ObjectId. */
export function stringToObjectIdConverter(target: any, cloneObject: boolean = true) {
    if (target instanceof ObjectId) {
        return target;
    }
    
    // If the value is a string that is a valid ObjectId, convert and return it.
    if (typeof target === "string" && ObjectId.isValid(target)) {
        return new ObjectId(target);
    }

    // If this isn't an object, then we can't convert it.
    if (!target || typeof target !== "object") {
        return target;
    }

    // Unless indicated otherwise, clone the object so we don't modify the original.
    let obj = cloneObject
        ? structuredClone(target)
        : target;

    // Examine each property.
    for (let prop in obj) {
        // Get the value, and the type.
        const value = obj[prop];
        const type = typeof value;

        if (type === "string" && ObjectId.isValid(value)) {
            // If this is a string that is a valid ObjectId, then convert it to an ObjectId.
            obj[prop] = new ObjectId(value as string);

        } else if (Array.isArray(value)) {
            // If this is an array, then recurse.  No need to clone,
            //  as we're already cloning the parent.
            obj[prop] = value.map(v => stringToObjectIdConverter(v, false));

        } else if (type === "object") {
            // If this is an object, then recurse.  No need to clone,
            //  as we're already cloning the parent.
            obj[prop] = stringToObjectIdConverter(value, false);

        } else {
            // Otherwise, do nothing - this is a primitive type.
        }
    }

    // Return the new object.
    return obj;
}