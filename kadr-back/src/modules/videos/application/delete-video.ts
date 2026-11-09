import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OBJECT_STORAGE } from '../../storage/domain/object-storage';
import type { ObjectStorage } from '../../storage/domain/object-storage';
import type { UserProfile } from '../../users/domain/user';
import { canDelete, canView } from '../domain/video-access';
import { VIDEO_REPOSITORY } from '../domain/video.repository';
import type { VideoRepository } from '../domain/video.repository';

@Injectable()
export class DeleteVideo {
  constructor(
    @Inject(VIDEO_REPOSITORY) private readonly videos: VideoRepository,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
  ) {}

  async execute(actor: UserProfile, id: string): Promise<void> {
    const video = await this.videos.findById(id);
    if (!video || !canView(actor, video)) {
      throw new NotFoundException('Video not found');
    }
    if (!canDelete(actor, video)) {
      throw new ForbiddenException('You cannot delete this video');
    }
    await this.storage.delete(video.originalKey).catch(() => undefined);
    if (video.playbackKey) {
      await this.storage.delete(video.playbackKey).catch(() => undefined);
    }
    if (video.thumbnailKey) {
      await this.storage.delete(video.thumbnailKey).catch(() => undefined);
    }
    await this.videos.delete(id);
  }
}
