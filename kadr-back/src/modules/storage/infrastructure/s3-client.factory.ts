import { Inject, Injectable } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { APP_CONFIG } from '../../../config/read-config';
import type { AppConfig } from '../../../config/read-config';

@Injectable()
export class S3ClientFactory {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  create(endpoint = this.config.s3.endpoint): S3Client {
    return new S3Client({
      region: this.config.s3.region,
      endpoint,
      forcePathStyle: this.config.s3.forcePathStyle,
      credentials: {
        accessKeyId: this.config.s3.accessKey,
        secretAccessKey: this.config.s3.secretKey,
      },
    });
  }
}
