import { ObjectId } from "mongodb";
import { DbCollectionNames } from "../model/db-collection-names.constants";
import { Company } from "../model/shared-models/company.model";
import { User } from "../model/shared-models/user.model";
import { MongoHelper } from "../mongo-helper";
import { DbService } from "./db-service";
import { nullToUndefined } from "../utils/empty-and-null.utils";


export class AuthDbService extends DbService {
    constructor(
        dbHelper: MongoHelper,
    ) {
        super(dbHelper);
    }

    async createUser(userName: string, webSite: string): Promise<User | undefined> {
        // Ensure we have valid values.
        const lcWebsite = webSite.toLowerCase();
        const lcUserName = userName.toLowerCase();

        return await this.dbHelper.makeCall(async db => {
            // Try to get the company for this website.
            const company = await db.collection(DbCollectionNames.Companies).findOne<Company>({ website: { $eq: lcWebsite } });

            // If we didn't find one, then we can't create a user.
            if (!company) {
                return undefined;
            }

            // Create the user.
            const user: User = {
                _id: new ObjectId(),
                companyId: company._id,
                userName: lcUserName
            };

            // Insert the user.
            await db.collection(DbCollectionNames.Users).insertOne(user);

            // Return the user.
            return user;
        });
    }

    /** Returns a user specified by their user ID, if one exists. */
    async getUserById(userId: ObjectId): Promise<User | undefined> {
        return this.dbHelper.makeCallWithCollection(DbCollectionNames.Users, async (db, collection) => {
            return nullToUndefined(await collection.findOne<User>({ _id: userId }));
        });
    }

    /** Given a specified user name and website, attempts to return the related user.  */
    async getUserByNameAndSite(userName: string, webSite: string): Promise<{ user?: User, company: Company; } | undefined> {
        // Ensure we have valid values.
        const lcWebsite = webSite.toLowerCase();
        const lcUserName = userName.toLowerCase();

        return await this.dbHelper.makeCall(async db => {
            // Try to get the company for this website.
            const company = await db.collection(DbCollectionNames.Companies).findOne<Company>({ website: { $eq: lcWebsite } });

            // If we didn't find one, then we don't have a user for the company.
            if (!company) {
                return undefined;
            }

            // Try to find the user.
            const user = nullToUndefined(await db.collection(DbCollectionNames.Users).findOne<User>({ userName: { $eq: lcUserName }, companyId: { $eq: company._id } }));

            // If there's no user, then we don't have a user for the company.
            if (!user) {
                return { user: undefined, company };
            }

            // Return the user and company.
            return { user, company };
        });
    }

}