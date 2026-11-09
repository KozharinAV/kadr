export type VideoQuality = 'high' | 'standard' | 'economy';

export interface EncodeSettings {
  quality: VideoQuality;
  rotate: boolean;
  mute: boolean;
  thumbnailOffsetSeconds: number;
}

export function encodeProfile(quality: VideoQuality): {
  height: number;
  crf: number;
} {
  if (quality === 'high') {
    return { height: 1080, crf: 20 };
  }
  if (quality === 'economy') {
    return { height: 480, crf: 28 };
  }
  return { height: 720, crf: 23 };
}

export function playbackName(quality: VideoQuality): string {
  if (quality === 'high') {
    return '1080p.mp4';
  }
  if (quality === 'economy') {
    return '480p.mp4';
  }
  return '720p.mp4';
}

export function previewSecond(requested: number, duration: number): number {
  if (duration <= 0) {
    return 0;
  }
  return Math.min(Math.max(0, requested), Math.max(0, duration - 0.05));
}
