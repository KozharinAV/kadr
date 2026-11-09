import { CreateBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { APP_CONFIG } from '../../../config/read-config';
import type { AppConfig } from '../../../config/read-config';
import { S3ClientFactory } from './s3-client.factory';

@Injectable()
export class EnsureBucket implements OnModuleInit {
  private readonly logger = new Logger(EnsureBucket.name);

  constructor(
    private readonly factory: S3ClientFactory,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async onModuleInit(): Promise<void> {
    const client = this.factory.create();
    await this.createIfMissing(client, this.config.s3.bucket);
    this.logger.log(`Bucket ${this.config.s3.bucket} is ready`);
  }

  private async createIfMissing(
    client: S3Client,
    bucket: string,
  ): Promise<void> {
    try {
      await client.send(new CreateBucketCommand({ Bucket: bucket }));
    } catch (error: unknown) {
      if (isAlreadyExists(error)) {
        return;
      }
      throw error;
    }
  }
}

function isAlreadyExists(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('name' in error)) {
    return false;
  }
  const name = error.name;
  return name === 'BucketAlreadyOwnedByYou' || name === 'BucketAlreadyExists';
}
