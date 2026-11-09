import type { EncodeSettings } from './encode-settings';
import { VideoStatus } from './video-status';

export interface Video {
  id: string;
  title: string;
  originalKey: string;
  playbackKey: string | null;
  thumbnailKey: string | null;
  status: VideoStatus;
  failureReason: string | null;
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
  ownerId: string;
  createdAt: Date;
  quality: EncodeSettings['quality'];
  rotate: boolean;
  mute: boolean;
  thumbnailOffsetSeconds: number;
}

export interface NewVideo {
  id: string;
  title: string;
  originalKey: string;
  ownerId: string;
  quality: EncodeSettings['quality'];
  rotate: boolean;
  mute: boolean;
  thumbnailOffsetSeconds: number;
}

export interface TranscodeResult {
  playbackKey: string;
  thumbnailKey: string;
  durationSeconds: number;
  width: number;
  height: number;
}

export function titleFromFilename(filename: string): string {
  const base = filename
    .replace(/^.*[/\\]/, '')
    .replace(/\.[^.]+$/, '')
    .trim();
  return (base || 'video').slice(0, 200);
}
