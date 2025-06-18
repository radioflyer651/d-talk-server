import { Request } from "express";
import { TokenPayload } from "../model/shared-models/token-payload.model";
import { AuthenticatedSpecialRequest } from "../model/authenticated-request.model";
import { ObjectId } from "mongodb";


/** Returns the TokenPayload, if one exists, on a specified request. */
export function getTokenPayloadFromRequest(req: Request): TokenPayload | undefined {
    const authReq = req as AuthenticatedSpecialRequest<typeof req>;

    return authReq.user;
}

/** Returns the user's ID, from the token on a specified request, if it exists. */
export function getUserIdFromRequest(req: Request): ObjectId | undefined {
    // Get the token.
    const token = getTokenPayloadFromRequest(req);

    // Return the ID, if we have one.
    if (token?.userId) {
        return new ObjectId(token?.userId);
    }

    // We don't have an ID.
    return undefined;
}