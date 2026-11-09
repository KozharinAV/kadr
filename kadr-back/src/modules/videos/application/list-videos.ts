import { Inject, Injectable } from '@nestjs/common';
import { Permission } from '../../auth/domain/permission';
import type { UserProfile } from '../../users/domain/user';
import { Video } from '../domain/video';
import { VIDEO_REPOSITORY } from '../domain/video.repository';
import type { VideoRepository } from '../domain/video.repository';

@Injectable()
export class ListVideos {
  constructor(
    @Inject(VIDEO_REPOSITORY) private readonly videos: VideoRepository,
  ) {}

  execute(actor: UserProfile, title?: string): Promise<Video[]> {
    const query = title?.trim() || undefined;
    if (actor.permissions.includes(Permission.VideoRetry)) {
      return this.videos.listAll(query);
    }
    if (actor.permissions.includes(Permission.VideoUpload)) {
      return this.videos.listOwnOrReady(actor.id, query);
    }
    return this.videos.listReady(query);
  }
}
