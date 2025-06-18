import { objectIdToStringConverter, stringToObjectIdConverter } from "../../utils/object-id-to-string-converter.utils";

let i = 0;

/** Middleware to convert any ObjectId in the body of a request to a string. */
export function bodyObjectIdsToStringMiddleware(req: any, res: any, next: any) {

    // Get the existing json method, so we make our own, but continue using that one.
    const json = res.json;

    // Override the json method.
    res.json = function (body: any) {
        // Convert any object IDs to strings.  We can't clone
        //  because ObjectIds get turned into other types when we do.
        body = objectIdToStringConverter(body);

        // Call the original json method.
        return json.call(this, body);
    };

    // Continue.
    next();
}