import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodSchema, ZodError } from 'zod';

/** Returns an Express middleware that validates req.body against the given Zod schema.
 *  On failure, responds 400 with a list of field-level errors and calls no further handlers. */
export function validateBody<T>(schema: ZodSchema<T>): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const errors = (result.error as ZodError).errors.map(e => ({
                field: e.path.join('.'),
                message: e.message,
            }));
            res.status(400).json({ message: 'Validation failed', errors });
            return;
        }
        req.body = result.data;
        next();
    };
}
