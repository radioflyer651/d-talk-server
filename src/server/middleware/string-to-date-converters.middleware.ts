import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to convert string representations of Dates in the request body to actual Date objects.
 * 
 * This middleware checks if the request body exists and then converts any string representations of Dates
 * to their corresponding ObjectId objects using the `convertDateStrings` utility function.  */
export function bodyStringsToDatesMiddleware(req: Request, res: Response, next: NextFunction) {
    // If the request body exists and is an object, convert any string properties
    //  This has a little risk, since a string could be misinterpreted as an ObjectId, 
    //  but it's a low risk.
    if (req.body && typeof req.body === 'object') {
        req.body = convertDateStrings(req.body);
    }

    next();
}

/**
 * Recursively converts all valid date-time string properties on the target object into Date objects.
 * @param target The object to transform in-place.
 */
export function convertDateStrings(target: any): any {
    // Just exist if we dont' have a target.
    if (!target) {
        return target;
    }

    if (target && typeof target === 'object') {
        if (Array.isArray(target)) {
            for (let i = 0; i < target.length; i++) {
                convertDateStrings(target[i]);
            }
        } else {
            for (const key of Object.keys(target)) {
                const value = target[key];
                if (typeof value === 'string' && isValidDate(value)) {
                    target[key] = new Date(value);
                } else {
                    convertDateStrings(value);
                }
            }
        }
    } else if (typeof target === 'string' && isValidDate(target)) {
        target = new Date(target);
    }

    return target;
}

function isValidDate(dateValue: string): boolean {
    if(typeof dateValue !== 'string'){
        return false;
    }

    return /^20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}::\d{2}\.\d+Z$/.test(dateValue);
}