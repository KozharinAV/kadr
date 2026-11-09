import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { readFile, unlink } from 'fs/promises';
import { extname } from 'path';
import { OBJECT_STORAGE } from '../../storage/domain/object-storage';
import type { ObjectStorage } from '../../storage/domain/object-storage';
import { TRANSCODE_QUEUE } from '../../transcode/domain/transcode-queue';
import type { TranscodeQueue } from '../../transcode/domain/transcode-queue';
import type { UserProfile } from '../../users/domain/user';
import type { EncodeSettings } from '../domain/encode-settings';
import { titleFromFilename, Video } from '../domain/video';
import { VIDEO_REPOSITORY } from '../domain/video.repository';
import type { VideoRepository } from '../domain/video.repository';

const ALLOWED_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-matroska',
]);

export interface UploadedVideoFile {
  path: string;
  originalName: string;
  mimeType: string;
}

@Injectable()
export class UploadVideo {
  constructor(
    @Inject(VIDEO_REPOSITORY) private readonly videos: VideoRepository,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
    @Inject(TRANSCODE_QUEUE) private readonly queue: TranscodeQueue,
  ) {}

  async execute(
    actor: UserProfile,
    file: UploadedVideoFile,
    settings: EncodeSettings,
    title?: string,
  ): Promise<Video> {
    if (!ALLOWED_TYPES.has(file.mimeType)) {
      await unlink(file.path).catch(() => undefined);
      throw new BadRequestException(
        'Only mp4, webm, mov and mkv files are accepted',
      );
    }

    const id = randomUUID();
    const extension =
      extname(file.originalName)
        .toLowerCase()
        .replace(/[^.a-z0-9]/g, '') || '.mp4';
    const key = `originals/${id}/source${extension}`;
    try {
      const body = await readFile(file.path);
      await this.storage.put({ key, body, contentType: file.mimeType });
      const video = await this.videos.insertQueued({
        id,
        title: (title?.trim() || titleFromFilename(file.originalName)).slice(
          0,
          200,
        ),
        originalKey: key,
        ownerId: actor.id,
        quality: settings.quality,
        rotate: settings.rotate,
        mute: settings.mute,
        thumbnailOffsetSeconds: settings.thumbnailOffsetSeconds,
      });
      await this.queue.enqueue(video.id);
      return video;
    } finally {
      await unlink(file.path).catch(() => undefined);
    }
  }
}
