import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

/**
 * Thin wrapper around the AWS S3 SDK. Points at MinIO locally (path-style
 * addressing) and is drop-in compatible with real AWS S3 by swapping the
 * endpoint/credentials in the environment.
 */
@Injectable()
export class S3Service implements OnModuleInit {
  private readonly logger = new Logger(S3Service.name);
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    const endpoint = this.config.get<string>('S3_ENDPOINT');
    this.bucket = this.config.getOrThrow<string>('S3_BUCKET');

    this.client = new S3Client({
      endpoint,
      region: this.config.get<string>('S3_REGION', 'us-east-1'),
      // MinIO requires path-style; AWS works with it too.
      forcePathStyle:
        this.config.get<string>('S3_FORCE_PATH_STYLE', 'true') === 'true',
      credentials: {
        accessKeyId: this.config.getOrThrow<string>('S3_ACCESS_KEY'),
        secretAccessKey: this.config.getOrThrow<string>('S3_SECRET_KEY'),
      },
    });
  }

  onModuleInit() {
    this.logger.log(`Storage configured for bucket "${this.bucket}"`);
  }

  /**
   * Builds a collision-free object key under a logical folder, preserving the
   * original file extension where possible.
   */
  buildObjectKey(folder: string, originalName: string): string {
    const extension = originalName.includes('.')
      ? `.${originalName.split('.').pop()}`
      : '';
    return `${folder}/${randomUUID()}${extension}`;
  }

  async uploadFile(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<string> {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      );
      return key;
    } catch (error) {
      this.logger.error(`Failed to upload object "${key}"`, error as Error);
      throw new InternalServerErrorException('Failed to store file');
    }
  }

  /**
   * Returns a time-limited URL the client can use to download the object
   * directly from storage, so the API never has to proxy file bytes.
   */
  async getSignedDownloadUrl(
    key: string,
    expiresInSeconds = 300,
  ): Promise<string> {
    try {
      return await getSignedUrl(
        this.client,
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
        { expiresIn: expiresInSeconds },
      );
    } catch (error) {
      this.logger.error(
        `Failed to sign download URL for "${key}"`,
        error as Error,
      );
      throw new InternalServerErrorException(
        'Failed to generate download link',
      );
    }
  }

  /**
   * Best-effort delete. Cleanup failures are logged but never bubble up, so a
   * storage hiccup can't block the database operation that owns the lifecycle.
   */
  async deleteObject(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      );
    } catch (error) {
      this.logger.warn(
        `Failed to delete object "${key}" — it may be orphaned: ${
          (error as Error).message
        }`,
      );
    }
  }
}
