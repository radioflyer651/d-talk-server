import { isValidString } from "../utils/strings.utils";
import { TokenPayload } from "../model/shared-models/token-payload.model";
import { LogDbService } from "../database/log-db.service";
import { getNormalizedWebsite } from "../utils/url-match.utils";
import { AuthDbService } from "../database/auth-db.service";


export class AuthService {
    constructor(
        private readonly dbService: AuthDbService,
        private readonly loggingService: LogDbService,
    ) {
        if (!dbService) {
            throw new Error("dbService cannot be null or undefined.");
        }
    }

}