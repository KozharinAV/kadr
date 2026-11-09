import { Inject, Injectable } from '@nestjs/common';
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { OBJECT_STORAGE } from '../../storage/domain/object-storage';
import type { ObjectStorage } from '../../storage/domain/object-storage';
import { VIDEO_REPOSITORY } from '../../videos/domain/video.repository';
import type { VideoRepository } from '../../videos/domain/video.repository';
import {
  playbackName,
  previewSecond,
} from '../../videos/domain/encode-settings';
import { VideoStatus } from '../../videos/domain/video-status';
import { MEDIA_TRANSCODER } from '../domain/media-transcoder';
import type { MediaTranscoder } from '../domain/media-transcoder';

@Injectable()
export class RunTranscode {
  constructor(
    @Inject(VIDEO_REPOSITORY) private readonly videos: VideoRepository,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
    @Inject(MEDIA_TRANSCODER) private readonly transcoder: MediaTranscoder,
  ) {}

  async execute(videoId: string): Promise<void> {
    const video = await this.videos.findById(videoId);
    if (!video || video.status === VideoStatus.Done) {
      return;
    }

    await this.videos.markProcessing(videoId);
    const directory = await mkdtemp(join(tmpdir(), 'kadr-'));
    const sourcePath = join(directory, 'source');
    const outputPath = join(directory, 'playback.mp4');
    const thumbPath = join(directory, 'thumb.jpg');
    try {
      const original = await this.storage.get(video.originalKey);
      await writeFile(sourcePath, original);
      const metadata = await this.transcoder.probe(sourcePath);
      const settings = {
        quality: video.quality,
        rotate: video.rotate,
        mute: video.mute,
        thumbnailOffsetSeconds: previewSecond(
          video.thumbnailOffsetSeconds,
          metadata.durationSeconds,
        ),
      };
      await this.transcoder.transcode(sourcePath, outputPath, settings);
      await this.transcoder.thumbnail(sourcePath, thumbPath, settings);
      const output = await this.transcoder.probe(outputPath);
      const playbackKey = `playback/${videoId}/${playbackName(video.quality)}`;
      const thumbnailKey = `thumbnails/${videoId}.jpg`;
      await this.storage.put({
        key: playbackKey,
        body: await readFile(outputPath),
        contentType: 'video/mp4',
      });
      await this.storage.put({
        key: thumbnailKey,
        body: await readFile(thumbPath),
        contentType: 'image/jpeg',
      });
      await this.videos.markDone(videoId, {
        playbackKey,
        thumbnailKey,
        durationSeconds: metadata.durationSeconds,
        width: output.width,
        height: output.height,
      });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }
}
