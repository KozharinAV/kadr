import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../storage/storage.module';
import { TranscodeQueueModule } from '../transcode/transcode-queue.module';
import { DeleteVideo } from './application/delete-video';
import { GetThumbnail } from './application/get-thumbnail';
import { GetVideo } from './application/get-video';
import { ListVideos } from './application/list-videos';
import { RetryTranscode } from './application/retry-transcode';
import { UploadVideo } from './application/upload-video';
import { VideoPresenter } from './application/video-presenter';
import { VIDEO_REPOSITORY } from './domain/video.repository';
import { TranscodeJobEntity } from './infrastructure/transcode-job.entity';
import { TypeOrmVideoRepository } from './infrastructure/typeorm-video.repository';
import { VideoEntity } from './infrastructure/video.entity';
import { VideosController } from './presentation/videos.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([VideoEntity, TranscodeJobEntity]),
    StorageModule,
    TranscodeQueueModule,
  ],
  controllers: [VideosController],
  providers: [
    UploadVideo,
    ListVideos,
    GetVideo,
    GetThumbnail,
    DeleteVideo,
    RetryTranscode,
    VideoPresenter,
    { provide: VIDEO_REPOSITORY, useClass: TypeOrmVideoRepository },
  ],
  exports: [VIDEO_REPOSITORY],
})
export class VideosModule {}
