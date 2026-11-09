import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';
import type { VideoQuality } from '../domain/encode-settings';
import { VideoStatus } from '../domain/video-status';

@Entity({ name: 'videos' })
export class VideoEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ length: 200 })
  title!: string;

  @Column({ name: 'original_key', length: 512 })
  originalKey!: string;

  @Column({
    name: 'playback_key',
    type: 'varchar',
    length: 512,
    nullable: true,
  })
  playbackKey!: string | null;

  @Column({
    name: 'thumbnail_key',
    type: 'varchar',
    length: 512,
    nullable: true,
  })
  thumbnailKey!: string | null;

  @Column({ length: 32 })
  status!: VideoStatus;

  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason!: string | null;

  @Column({ name: 'duration_seconds', type: 'float', nullable: true })
  durationSeconds!: number | null;

  @Column({ type: 'int', nullable: true })
  width!: number | null;

  @Column({ type: 'int', nullable: true })
  height!: number | null;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId!: string;

  @Column({ length: 16, default: 'standard' })
  quality!: VideoQuality;

  @Column({ default: false })
  rotate!: boolean;

  @Column({ default: false })
  mute!: boolean;

  @Column({ name: 'thumbnail_offset_seconds', type: 'int', default: 0 })
  thumbnailOffsetSeconds!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
