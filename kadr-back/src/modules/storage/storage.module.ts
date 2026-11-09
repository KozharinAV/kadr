import { Module } from '@nestjs/common';
import { AppConfigModule } from '../../config/app-config.module';
import { OBJECT_STORAGE } from './domain/object-storage';
import { EnsureBucket } from './infrastructure/ensure-bucket';
import { S3ClientFactory } from './infrastructure/s3-client.factory';
import { S3ObjectStorage } from './infrastructure/s3-object-storage';

@Module({
  imports: [AppConfigModule],
  providers: [
    S3ClientFactory,
    EnsureBucket,
    { provide: OBJECT_STORAGE, useClass: S3ObjectStorage },
  ],
  exports: [OBJECT_STORAGE],
})
export class StorageModule {}
