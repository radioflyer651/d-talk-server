
/** Returns a boolean value indicating whether or not a specified (expected) string is a string
 *   with something other than whitespace.
 */
export function isValidString(target: string | undefined | null): target is string {
    if (!target) {
        return false;
    }

    return target.trim() !== '';
}