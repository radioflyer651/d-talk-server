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

    /** Attempts to validate a user, and if they exist, returns an ID for them.  If not, then returns undefined. */
    async login(userName: string, webSite: string): Promise<TokenPayload | undefined> {
        // Make sure the website is proper.
        webSite = getNormalizedWebsite(webSite);

        await this.loggingService.logMessage({
            level: "info", message: `User attempted to log in: ${userName}, ${webSite}`,
            data: {
                user: userName,
                webSite: webSite
            }
        });

        // Ensure we have valid values.
        if (!isValidString(userName) || !isValidString(webSite)) {
            await this.loggingService.logMessage({
                level: 'error', message: `Failed user login: ${userName}, ${webSite}`,
                data: {
                    user: userName,
                    webSite: webSite
                }
            });
            return undefined;
        }

        const lcWebsite = webSite.toLowerCase();
        const lcUserName = userName.toLowerCase();

        // Attempt to find the user.
        let userInfo = await this.dbService.getUserByNameAndSite(lcUserName, lcWebsite);
        if (userInfo?.company && !userInfo?.user) {
            // If we don't have a user, then we must create one.
            userInfo.user = await this.dbService.createUser(lcUserName, lcWebsite);
        }

        // Return the user's ID.
        const result = userInfo?.user ? {
            userId: userInfo.user._id,
            website: userInfo.company.website,
            companyName: userInfo.company.name,
            name: userInfo.user.userName,
            isAdmin: userInfo.user.isAdmin
        } : undefined;

        await this.loggingService.logMessage({
            level: 'info',
            message: `${userName} logged in successfully.`,
            data: result
        });

        return result;
    }
}