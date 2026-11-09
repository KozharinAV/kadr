import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { VideoStatus } from '../domain/video-status';
import { NewVideo, TranscodeResult, Video } from '../domain/video';
import { VideoRepository } from '../domain/video.repository';
import { TranscodeJobEntity } from './transcode-job.entity';
import { VideoEntity } from './video.entity';

@Injectable()
export class TypeOrmVideoRepository implements VideoRepository {
  constructor(
    @InjectRepository(VideoEntity)
    private readonly videos: Repository<VideoEntity>,
    @InjectRepository(TranscodeJobEntity)
    private readonly jobs: Repository<TranscodeJobEntity>,
  ) {}

  async insertQueued(video: NewVideo): Promise<Video> {
    const saved = await this.videos.save(
      this.videos.create({
        id: video.id,
        title: video.title,
        originalKey: video.originalKey,
        playbackKey: null,
        thumbnailKey: null,
        status: VideoStatus.Queued,
        failureReason: null,
        durationSeconds: null,
        width: null,
        height: null,
        ownerId: video.ownerId,
        quality: video.quality,
        rotate: video.rotate,
        mute: video.mute,
        thumbnailOffsetSeconds: video.thumbnailOffsetSeconds,
      }),
    );
    await this.jobs.save(
      this.jobs.create({
        id: randomUUID(),
        videoId: saved.id,
        status: VideoStatus.Queued,
        error: null,
        finishedAt: null,
      }),
    );
    return this.toDomain(saved);
  }

  async listAll(title?: string): Promise<Video[]> {
    const rows = await this.listed(title).getMany();
    return rows.map((row) => this.toDomain(row));
  }

  async listReady(title?: string): Promise<Video[]> {
    const rows = await this.listed(title)
      .andWhere('video.status = :status', { status: VideoStatus.Done })
      .getMany();
    return rows.map((row) => this.toDomain(row));
  }

  async listOwnOrReady(ownerId: string, title?: string): Promise<Video[]> {
    const rows = await this.listed(title)
      .andWhere('(video.owner_id = :ownerId OR video.status = :status)', {
        ownerId,
        status: VideoStatus.Done,
      })
      .getMany();
    return rows.map((row) => this.toDomain(row));
  }

  private listed(title?: string): SelectQueryBuilder<VideoEntity> {
    const query = this.videos
      .createQueryBuilder('video')
      .orderBy('video.created_at', 'DESC');
    const fragment = title?.trim();
    if (fragment) {
      query.andWhere("video.title ILIKE :title ESCAPE '\\'", {
        title: `%${escapeLike(fragment)}%`,
      });
    }
    return query;
  }

  async findById(id: string): Promise<Video | null> {
    const row = await this.videos.findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async markProcessing(id: string): Promise<void> {
    await this.videos.update(
      { id },
      { status: VideoStatus.Processing, failureReason: null },
    );
    await this.updateLatestJob(id, {
      status: VideoStatus.Processing,
      error: null,
      finishedAt: null,
    });
  }

  async markDone(id: string, result: TranscodeResult): Promise<void> {
    await this.videos.update(
      { id },
      {
        status: VideoStatus.Done,
        playbackKey: result.playbackKey,
        thumbnailKey: result.thumbnailKey,
        durationSeconds: result.durationSeconds,
        width: result.width,
        height: result.height,
        failureReason: null,
      },
    );
    await this.updateLatestJob(id, {
      status: VideoStatus.Done,
      error: null,
      finishedAt: new Date(),
    });
  }

  async markFailed(id: string, reason: string): Promise<void> {
    await this.videos.update(
      { id },
      { status: VideoStatus.Failed, failureReason: reason.slice(0, 2000) },
    );
    await this.updateLatestJob(id, {
      status: VideoStatus.Failed,
      error: reason.slice(0, 2000),
      finishedAt: new Date(),
    });
  }

  async requeue(id: string): Promise<void> {
    await this.videos.update(
      { id },
      { status: VideoStatus.Queued, failureReason: null },
    );
    await this.jobs.save(
      this.jobs.create({
        id: randomUUID(),
        videoId: id,
        status: VideoStatus.Queued,
        error: null,
        finishedAt: null,
      }),
    );
  }

  async delete(id: string): Promise<void> {
    await this.videos.delete({ id });
  }

  private async updateLatestJob(
    videoId: string,
    patch: Pick<TranscodeJobEntity, 'status' | 'error' | 'finishedAt'>,
  ): Promise<void> {
    const latest = await this.jobs.findOne({
      where: { videoId },
      order: { createdAt: 'DESC' },
    });
    if (!latest) {
      return;
    }
    await this.jobs.update({ id: latest.id }, patch);
  }

  private toDomain(entity: VideoEntity): Video {
    return {
      id: entity.id,
      title: entity.title,
      originalKey: entity.originalKey,
      playbackKey: entity.playbackKey,
      thumbnailKey: entity.thumbnailKey,
      status: entity.status,
      failureReason: entity.failureReason,
      durationSeconds: entity.durationSeconds,
      width: entity.width,
      height: entity.height,
      ownerId: entity.ownerId,
      createdAt: entity.createdAt,
      quality: entity.quality,
      rotate: entity.rotate,
      mute: entity.mute,
      thumbnailOffsetSeconds: entity.thumbnailOffsetSeconds,
    };
  }
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}
