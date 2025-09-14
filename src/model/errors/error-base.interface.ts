
/** Base interface for errors. */
export interface IErrorBase {
    readonly message: string;
}

/** TypeGuard for the IErrorBase type. */
export function isErrorBase(target: any): target is IErrorBase {
    return typeof target === 'object' &&
        'message' in target &&
        typeof target.message === 'string';
}

/** Gets the error text from a specified error. */
export function getErrorText(error: any): string {
    if (isErrorBase(error)) {
        return error.message;
    }

    if (typeof error === 'string') {
        return error;
    }

    return 'Unknown error';
}