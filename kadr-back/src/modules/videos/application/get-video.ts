import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { UserProfile } from '../../users/domain/user';
import { canView } from '../domain/video-access';
import { Video } from '../domain/video';
import { VIDEO_REPOSITORY } from '../domain/video.repository';
import type { VideoRepository } from '../domain/video.repository';

@Injectable()
export class GetVideo {
  constructor(
    @Inject(VIDEO_REPOSITORY) private readonly videos: VideoRepository,
  ) {}

  async execute(actor: UserProfile, id: string): Promise<Video> {
    const video = await this.videos.findById(id);
    if (!video || !canView(actor, video)) {
      throw new NotFoundException('Video not found');
    }
    return video;
  }
}
