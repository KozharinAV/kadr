import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { OBJECT_STORAGE } from '../../storage/domain/object-storage';
import type { ObjectStorage } from '../../storage/domain/object-storage';
import { VIDEO_REPOSITORY } from '../domain/video.repository';
import type { VideoRepository } from '../domain/video.repository';

@Injectable()
export class GetThumbnail {
  constructor(
    @Inject(VIDEO_REPOSITORY) private readonly videos: VideoRepository,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
  ) {}

  async execute(id: string): Promise<Buffer> {
    const video = await this.videos.findById(id);
    if (!video?.thumbnailKey) {
      throw new NotFoundException('Thumbnail not found');
    }
    return this.storage.get(video.thumbnailKey);
  }
}
