import { ObjectId } from "mongodb";
import { DbCollectionNames } from "../model/db-collection-names.constants";
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


}