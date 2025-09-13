
export interface IAppConfig {
    openAiConfig: OpenAiConfig;
    mongo: MongoConfig;
    tokenSecret: string;
    corsAllowed?: string[];
    serverConfig: ServerConfig;
    /** The full path to the socket.io endpoint for chatting. */
    chatSocketIoEndpoint: string;
    /** The path of the socket.  This is different than the namespace. */
    chatSocketIoPath: string;
    tavilyConfiguration: TavilyConfiguration;

    awsCredentials: AwsCredentials;
    voiceConfiguration: VoiceConfiguration;
    humeCredentials: HumeApiCredentials;
}

export interface OpenAiConfig {
    openAiOrg: string;
    openAiKey: string;
}

export interface MongoConfig {
    connectionString: string;
    databaseName: string;
}

export interface ServerConfig {
    port: number;
}

export interface TavilyConfiguration {
    apiKey: string;
}

export interface AwsCredentials {
    accessKey: string;
    secretAccessKey: string;
}

/** Configuration for voice audio generation and storage. */
export interface VoiceConfiguration {
    /** The name of the bucket to store voice data in. */
    bucketName: string;

    /** The name of the model to use for voice generation. */
    openAiModelName: string;

    /** The AWS region the bucket is located in. */
    bucketRegion: string;
}

/** Credentials for the Hume service, which provides voice audio. */
export interface HumeApiCredentials {
    apiKey: string;
    secretKey: string;
}