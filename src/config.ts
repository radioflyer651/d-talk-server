import fs from 'fs/promises';
import path from 'path';
import { IAppConfig } from './model/app-config.model';
let appConfig: IAppConfig | undefined;

/** Reads the app config, caches it, and returns it. */
export async function getAppConfig(): Promise<IAppConfig> {
    // Get the environment variables.
    const env = process.env;

    if (!appConfig) {
        const configPath = path.join(__dirname, '..', 'app-config.json');
        const configJson = await fs.readFile(configPath, 'utf-8');
        appConfig = JSON.parse(configJson) as IAppConfig;

        updateConfigWithEnvVars(appConfig);
        convertFilePathsToAbsolute(appConfig);
    }
    return appConfig;
}

/** Converts all file paths on a specified target object, and nested objects, to be absolute paths. */
function convertFilePathsToAbsolute(target: object): void {
    const recast: { [key: string]: any; } = target;

    for (let n in recast) {
        const value = recast[n];
        const valueType = typeof value;
        if (valueType === 'string') {
            if (/^\.\.?\//.test(value as string)) {
                recast[n] = path.join(__dirname, '..', value);
            }
        } else if (valueType === 'object' && !!valueType) {
            convertFilePathsToAbsolute(value);
        }
    }
}

/** Replaces any configuration value with ENV values, if they exist. */
function updateConfigWithEnvVars(config: IAppConfig): void {
    updateConfigWithEnvVarsR(config, ConfigToEnvMap);
}

function updateConfigWithEnvVarsR(config: any, propertyMap: any): void {
    // Get the environment locally.
    const env = process.env;

    // Recast to satisfy the compiler.
    const envMap = ConfigToEnvMap as any;

    // Update each property recursively.
    for (let key in envMap) {
        const curProp = envMap[key];
        const curVal = env[curProp];

        if (typeof curProp === 'string') {
            if (typeof curVal === 'string' && curVal.trim() !== '') {
                config[key] = env[curProp];
            }
        } else {
            // Get the current value on the configuration.
            const curConfigObj = config[key];

            // If we don't have one, just move on.
            if (!curConfigObj) {
                continue;
            }

            // Object - call recursively.
            updateConfigWithEnvVarsR(config[key], curProp);
        }
    }
}

type LeafToStringOrUndefined<T> = Partial<{
    [K in keyof T]: T[K] extends object
    ? LeafToStringOrUndefined<T[K]>
    : string | undefined;
}>;

const ConfigToEnvMap: LeafToStringOrUndefined<IAppConfig> = {
    openAiConfig: {
        openAiKey: 'OPENAI_KEY',
        openAiOrg: 'OPENAI_ORG_ID'
    },
    mongo: {
        connectionString: 'MONGODB_CS',
        databaseName: 'MONGO_DB_NAME'
    },
    serverConfig: {
        port: 'RESUME_SERVER_PORT'
    },
    tokenSecret: 'JWT_SECRET_KEY'
};