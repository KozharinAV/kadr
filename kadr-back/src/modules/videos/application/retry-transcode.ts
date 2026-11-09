import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TRANSCODE_QUEUE } from '../../transcode/domain/transcode-queue';
import type { TranscodeQueue } from '../../transcode/domain/transcode-queue';
import type { UserProfile } from '../../users/domain/user';
import { canView } from '../domain/video-access';
import { Video } from '../domain/video';
import { VideoStatus } from '../domain/video-status';
import { VIDEO_REPOSITORY } from '../domain/video.repository';
import type { VideoRepository } from '../domain/video.repository';

@Injectable()
export class RetryTranscode {
  constructor(
    @Inject(VIDEO_REPOSITORY) private readonly videos: VideoRepository,
    @Inject(TRANSCODE_QUEUE) private readonly queue: TranscodeQueue,
  ) {}

  async execute(actor: UserProfile, id: string): Promise<Video> {
    const video = await this.videos.findById(id);
    if (!video || !canView(actor, video)) {
      throw new NotFoundException('Video not found');
    }
    if (video.status !== VideoStatus.Failed) {
      throw new BadRequestException('Only a failed video can be retried');
    }
    await this.videos.requeue(id);
    await this.queue.enqueue(id);
    const updated = await this.videos.findById(id);
    if (!updated) {
      throw new NotFoundException('Video not found');
    }
    return updated;
  }
}
