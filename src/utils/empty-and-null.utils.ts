

/** If a value is null, then returns undefined.  Otherwise, returns the input value. */
export function nullToUndefined<T>(value: Promise<T | null>): Promise<T | undefined>;
export function nullToUndefined<T>(value: T | null): T | undefined;
export function nullToUndefined<T>(value: T | null | Promise<T | null>): T | undefined | Promise<T | undefined> {
    // Handle a promise.
    if (value instanceof Promise) {
        return value.then(v => nullToUndefined(v));
    }
    return value === null ? undefined : value;
}