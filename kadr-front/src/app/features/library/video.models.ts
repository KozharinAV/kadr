export type VideoStatus = 'queued' | 'processing' | 'done' | 'failed';

export type VideoQuality = 'high' | 'standard' | 'economy';

export interface UploadOptions {
  title: string;
  quality: VideoQuality;
  rotate: boolean;
  mute: boolean;
  thumbnailOffset: number;
}

export interface VideoView {
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

export function formatDuration(seconds: number | null): string {
  if (seconds == null) {
    return '';
  }
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${rest.toString().padStart(2, '0')}`;
}
