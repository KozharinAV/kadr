import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';
import { VideoStatus } from '../domain/video-status';

@Entity({ name: 'transcode_jobs' })
export class TranscodeJobEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'video_id', type: 'uuid' })
  videoId!: string;

  @Column({ length: 32 })
  status!: VideoStatus;

  @Column({ type: 'text', nullable: true })
  error!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'finished_at', type: 'timestamptz', nullable: true })
  finishedAt!: Date | null;
}
