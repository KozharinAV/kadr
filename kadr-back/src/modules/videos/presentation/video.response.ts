import { VideoStatus } from '../domain/video-status';

export interface VideoResponse {
  id: string;
  title: string;
  status: VideoStatus;
  failureReason: string | null;
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
  ownerId: string;
  createdAt: string;
  playbackUrl: string | null;
  thumbnailUrl: string | null;
}
