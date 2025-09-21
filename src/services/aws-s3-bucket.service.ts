import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, PutObjectCommandInput, S3Client } from '@aws-sdk/client-s3';
import { IAppConfig, VoiceConfiguration } from '../model/app-config.model';
import { AwsBucketObjectReference } from '../model/shared-models/chat-core/aws-bucket-object-reference.model';
import { AwsStoreTypes } from '../model/shared-models/storeable-types.model';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';


/** Provides operations for interacting with AWS' S3 bucket services. */
export class AwsS3BucketService {
    constructor(appConfig: IAppConfig) {
        if (!appConfig) {
            throw new Error('appConfig must have a value.');
        }

        this.voiceConfiguration = appConfig.voiceConfiguration;

        this.s3Client = new S3Client({
            region: appConfig.voiceConfiguration.bucketRegion,
            credentials: {
                accessKeyId: appConfig.awsCredentials.accessKey,
                secretAccessKey: appConfig.awsCredentials.secretAccessKey,
            }
        });
    }

    protected s3Client: S3Client;

    protected voiceConfiguration: VoiceConfiguration;

    async deleteObject(reference: AwsBucketObjectReference) {
        const cmd = new DeleteObjectCommand({
            Bucket: reference.bucket,
            Key: reference.key,
        });

        await this.s3Client.send(cmd);
    }

    async storeObject(reference: AwsBucketObjectReference, content: AwsStoreTypes) {
        if (!reference.contentType) {
            throw new Error(`reference.contentType must be set.`);
        }

        const cmd = new PutObjectCommand({
            Bucket: reference.bucket,
            Key: reference.key,
            ContentType: reference.contentType,
            Body: content
        });

        await this.s3Client.send(cmd);
    }

    /**
     * Returns a browser-usable S3 URI for the given object reference.
     * @param reference The AWS bucket object reference.
     * @returns The URI as a string.
     */
    async getDownloadUriForObject(reference: AwsBucketObjectReference): Promise<string> {
        if (!reference.bucket || !reference.key) {
            throw new Error('Both bucket and key must be provided in the reference.');
        }

        const command = new GetObjectCommand({
            Bucket: reference.bucket,
            Key: reference.key,
        });

        // Default expiration: 1 hour
        return await getSignedUrl(this.s3Client, command, {});
    }
}
