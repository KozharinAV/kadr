import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/app-config.module';
import { DatabaseModule } from './database/database.module';
import { StorageModule } from './modules/storage/storage.module';
import { MEDIA_TRANSCODER } from './modules/transcode/domain/media-transcoder';
import { FfmpegMediaTranscoder } from './modules/transcode/infrastructure/ffmpeg-media-transcoder';
import { RunTranscode } from './modules/transcode/application/run-transcode';
import { TranscodeProcessor } from './modules/transcode/transcode.processor';
import { TranscodeQueueModule } from './modules/transcode/transcode-queue.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { WorkerMetricsServer } from './modules/metrics/worker-metrics.server';
import { VideosModule } from './modules/videos/videos.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    StorageModule,
    VideosModule,
    TranscodeQueueModule,
    MetricsModule,
  ],
  providers: [
    RunTranscode,
    TranscodeProcessor,
    WorkerMetricsServer,
    { provide: MEDIA_TRANSCODER, useClass: FfmpegMediaTranscoder },
  ],
})
export class WorkerModule {}
