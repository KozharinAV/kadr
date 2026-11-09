import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { APP_CONFIG } from '../../config/read-config';
import type { AppConfig } from '../../config/read-config';
import { TRANSCODE_QUEUE_NAME } from './domain/transcode-job-data';
import { TRANSCODE_QUEUE } from './domain/transcode-queue';
import { BullTranscodeQueue } from './infrastructure/bull-transcode-queue';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => {
        const redis = new URL(config.redisUrl);
        return {
          connection: {
            host: redis.hostname,
            port: Number(redis.port || 6379),
            password: redis.password
              ? decodeURIComponent(redis.password)
              : undefined,
          },
        };
      },
    }),
    BullModule.registerQueue({ name: TRANSCODE_QUEUE_NAME }),
  ],
  providers: [{ provide: TRANSCODE_QUEUE, useClass: BullTranscodeQueue }],
  exports: [TRANSCODE_QUEUE, BullModule],
})
export class TranscodeQueueModule {}
