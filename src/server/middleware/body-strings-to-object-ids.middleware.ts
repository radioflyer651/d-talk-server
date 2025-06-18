import { Request, Response, NextFunction } from 'express';
import { stringToObjectIdConverter } from '../../utils/object-id-to-string-converter.utils';


/**
 * Middleware to convert string representations of ObjectIds in the request body to actual ObjectId objects.
 * 
 * This middleware checks if the request body exists and then converts any string representations of ObjectIds
 * to their corresponding ObjectId objects using the `stringToObjectIdConverter` utility function.
 * 
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @param next - The next middleware function in the stack.
 */
export function bodyStringsToObjectIdsMiddleware(req: Request, res: Response, next: NextFunction) {
    // If the request body exists and is an object, convert any string properties
    //  This has a little risk, since a string could be misinterpreted as an ObjectId, 
    //  but it's a low risk.
    if (req.body && typeof req.body === 'object') {
        req.body = stringToObjectIdConverter(req.body);
    }

    next();
}