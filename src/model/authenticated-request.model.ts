import { TokenPayload } from "./shared-models/token-payload.model";

/** A request that (possibly) has authenticated data about the user. */
export interface AuthenticatedRequest extends Request {
    user?: TokenPayload;
}

export type AuthenticatedSpecialRequest<T> = T & {
    user?: TokenPayload;
};
