import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { StorageProvider } from './index';

export class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private bucketExistsChecked = false;

  constructor() {
    const endpoint = process.env.S3_ENDPOINT;
    const region = process.env.S3_REGION || 'auto';
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
    this.bucket = process.env.S3_BUCKET || 'base0';

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('S3 credentials (ACCESS_KEY_ID/SECRET_ACCESS_KEY) are missing');
    }

    this.client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      // Essential for MinIO and R2 compatibility
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    });
  }

  private async ensureBucketExists() {
    if (this.bucketExistsChecked) return;

    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch (e) {
      // If bucket doesn't exist (404), try to create it
      const err = e as { name?: string; $metadata?: { httpStatusCode?: number } };
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        try {
          await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
          console.log(`Created S3 bucket: ${this.bucket}`);
        } catch (createErr) {
          console.error(`Failed to create S3 bucket: ${this.bucket}`, createErr);
        }
      } else {
        console.error(`Failed to check S3 bucket availability: ${this.bucket}`, e);
      }
    }
    this.bucketExistsChecked = true;
  }

  async upload(path: string, data: Buffer | Uint8Array, mimeType: string): Promise<void> {
    await this.ensureBucketExists();
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: path,
      Body: data,
      ContentType: mimeType,
    });

    await this.client.send(command);
  }

  async download(path: string): Promise<Uint8Array> {
    await this.ensureBucketExists();
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: path,
    });

    const response = await this.client.send(command);
    if (!response.Body) {
      throw new Error('Empty response body from S3');
    }

    return await response.Body.transformToByteArray();
  }

  async delete(path: string): Promise<void> {
    await this.ensureBucketExists();
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: path,
    });

    await this.client.send(command);
  }

  async getSignedUrl(path: string, expiresIn: number): Promise<string> {
    await this.ensureBucketExists();
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: path,
    });

    return await getSignedUrl(this.client, command, { expiresIn });
  }
}
