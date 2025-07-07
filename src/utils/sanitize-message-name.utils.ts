

/** Replaces any illegal characters on a name in a message, avoiding issues with making calls in the LLM. */
export function sanitizeMessageName(name: string | undefined): string | undefined {
    const result = name?.trim().replaceAll(/\s/g, '_').replaceAll(/\</g, '(').replaceAll(/\>/g, ')').replaceAll(/[|\\/]/g, '.');
    if (result === '') {
        return undefined;
    }
    return result;
}