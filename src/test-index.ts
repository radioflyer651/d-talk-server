import { getAppConfig } from "./config";
import { MongoHelper } from "./mongo-helper";
import { MongoDbStore } from "./services/lang-chain/mongo-store.service";

async function showMe() {
    const config = await getAppConfig();
    const helper = new MongoHelper(config.mongo.connectionString, config.mongo.databaseName);

    const mongoStore = new MongoDbStore(
        'test-collection',
        helper
    );

    const namespace = ['test1', 'test2'];
    const key = 'memory-1';

    // await mongoStore.put(namespace, key, {
    //     firstName: 'zero',
    //     lastName: 'code',
    //     motto: 'Will script for money'
    // });

    // const newValue = await mongoStore.get(namespace, key);

    const x = await mongoStore.search(['test1', 'test2'], { filter: { lastName: 'code' } });

    console.log(JSON.stringify(x, undefined, 4));
}

showMe().then(() => {
    process.exit(1);
});