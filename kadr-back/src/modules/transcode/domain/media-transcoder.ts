import type { EncodeSettings } from '../../videos/domain/encode-settings';

export interface MediaMetadata {
  durationSeconds: number;
  width: number;
  height: number;
}

export interface MediaTranscoder {
  probe(inputPath: string): Promise<MediaMetadata>;
  transcode(
    inputPath: string,
    outputPath: string,
    settings: EncodeSettings,
  ): Promise<void>;
  thumbnail(
    inputPath: string,
    outputPath: string,
    settings: EncodeSettings,
  ): Promise<void>;
}

export const MEDIA_TRANSCODER = Symbol('MEDIA_TRANSCODER');
