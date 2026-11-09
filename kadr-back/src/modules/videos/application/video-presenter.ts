import { Inject, Injectable } from '@nestjs/common';
import { OBJECT_STORAGE } from '../../storage/domain/object-storage';
import type { ObjectStorage } from '../../storage/domain/object-storage';
import { Video } from '../domain/video';
import { VideoResponse } from '../presentation/video.response';

const LINK_TTL_SECONDS = 900;

@Injectable()
export class VideoPresenter {
  constructor(
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
  ) {}

  async present(video: Video): Promise<VideoResponse> {
    const playbackUrl = video.playbackKey
      ? await this.storage.presign(video.playbackKey, LINK_TTL_SECONDS)
      : null;
    const thumbnailUrl = video.thumbnailKey
      ? `/api/videos/${video.id}/thumbnail`
      : null;
    return {
      id: video.id,
      title: video.title,
      status: video.status,
      failureReason: video.failureReason,
      durationSeconds: video.durationSeconds,
      width: video.width,
      height: video.height,
      ownerId: video.ownerId,
      createdAt: video.createdAt.toISOString(),
      playbackUrl,
      thumbnailUrl,
    };
  }
}
