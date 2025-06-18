import { DbCollectionNames } from "../model/db-collection-names.constants";
import { nullToUndefined } from "../utils/empty-and-null.utils";
import { DbService } from "./db-service";
import { SiteSettings } from "../model/shared-models/site-settings.model";


export class AdminDbService extends DbService {

    /** Returns the site settings from the database. */
    async getSiteSettings(): Promise<SiteSettings | undefined> {
        return await this.dbHelper.makeCallWithCollection(DbCollectionNames.SiteSettings, async (db, collection) => {
            return await nullToUndefined(collection.findOne<SiteSettings>({
                type: 'site-settings'
            }));
        });
    }

    /** Checks if the site settings for the site exist, and if not, inserts the default settings. */
    async initializeSiteSettings(): Promise<void> {
        await this.dbHelper.makeCallWithCollection(DbCollectionNames.SiteSettings, async (db, collection) => {
            const existingSettings = await collection.findOne<SiteSettings>({ type: 'site-settings' });
            if (!existingSettings) {
                const defaultSettings: SiteSettings = {
                    type: 'site-settings',
                    allowAudioChat: false
                };
                await collection.insertOne(defaultSettings);
            }
        });
    }

    /** Returns the allowAudioChat value from the SiteSettings in the database. */
    async getAllowAudioChat(): Promise<boolean> {
        const settings = await this.getSiteSettings();
        return settings?.allowAudioChat ?? false;
    }

    /** Sets the allowAudioChat value in the database. */
    async setAllowAudioChat(value: boolean): Promise<void> {
        await this.dbHelper.makeCallWithCollection(DbCollectionNames.SiteSettings, async (db, collection) => {
            await collection.updateOne(
                { type: 'site-settings' },
                { $set: { allowAudioChat: value } }
            );
        });
    }
}