

/** Recursively searches an object, and deletes any properties that are set to null or undefined. */
export function removeNullProperties(target: object): void {
    const searchable = target as { [n: string]: any; };

    for (let n in searchable) {
        const val = searchable[n];

        if (val === null || val === undefined) {
            delete searchable[n];
        } else if (typeof val === 'object') {
            removeNullProperties(searchable[n]);
        }
    }
}