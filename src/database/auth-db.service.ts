import { ObjectId } from "mongodb";
import { DbCollectionNames } from "../model/db-collection-names.constants";
import { User } from "../model/shared-models/user.model";
import { MongoHelper } from "../mongo-helper";
import { DbService } from "./db-service";
import { UserSecrets } from "../model/shared-models/user-secrets.model";
import { NewDbItem } from "../model/shared-models/db-operation-types.model";


export class AuthDbService extends DbService {
    constructor(
        dbHelper: MongoHelper,
    ) {
        super(dbHelper);
    }

    /** Create a new user secrets entry (registration). */
    async createUserSecrets(secrets: Omit<UserSecrets, "createdAt"> & { _id: ObjectId, passwordHash: string; }): Promise<UserSecrets> {
        const now = new Date();
        const doc = { ...secrets, createdAt: now };
        return this.dbHelper.makeCallWithCollection(DbCollectionNames.UserSecrets, async (db, collection) => {
            await collection.insertOne(secrets);
            return secrets as UserSecrets;
        });
    }

    /** Get user secrets by userId. */
    async getUserSecretsByUserId(userId: ObjectId): Promise<UserSecrets | undefined> {
        return await this.dbHelper.findDataItem<UserSecrets, { _id: ObjectId; }>(
            DbCollectionNames.UserSecrets,
            { _id: userId },
            { findOne: true }
        ) as UserSecrets | undefined;
    }

    /** Update a user's password hash. */
    async updateUserPassword(userId: ObjectId, newPasswordHash: string): Promise<number> {
        return await this.dbHelper.updateDataItems<UserSecrets>(
            DbCollectionNames.UserSecrets,
            { _id: userId },
            { passwordHash: newPasswordHash, updatedAt: new Date() },
            { updateOne: true }
        );
    }

    /** Delete a user's secrets (dangerous, admin only). */
    async deleteUserSecrets(userId: ObjectId): Promise<number> {
        return await this.dbHelper.deleteDataItems<UserSecrets, { _id: ObjectId; }>(
            DbCollectionNames.UserSecrets,
            { _id: userId },
            { deleteMany: false }
        );
    }

    // --- User CRUD ---
    async getUserByUserName(userName: string): Promise<User | undefined> {
        // Use a case-insensitive regex for userName matching
        return await this.dbHelper.findDataItem<User, { userName: any }>(
            DbCollectionNames.Users,
            { userName: { $regex: `^${userName}$`, $options: 'i' } },
            { findOne: true }
        ) as User | undefined;
    }

    /** Get a user by their ObjectId. */
    async getUserById(userId: ObjectId): Promise<User | undefined> {
        return await this.dbHelper.findDataItem<User, { _id: ObjectId }>(
            DbCollectionNames.Users,
            { _id: userId },
            { findOne: true }
        ) as User | undefined;
    }

    async createUser(user: NewDbItem<User>): Promise<User> {
        return await this.dbHelper.upsertDataItem<User>(DbCollectionNames.Users, user) as User;
    }
}