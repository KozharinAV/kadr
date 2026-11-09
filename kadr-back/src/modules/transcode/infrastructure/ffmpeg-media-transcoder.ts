import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';
import {
  encodeProfile,
  type EncodeSettings,
} from '../../videos/domain/encode-settings';
import { MediaMetadata, MediaTranscoder } from '../domain/media-transcoder';
import { PermanentMediaError } from '../domain/permanent-media-error';

@Injectable()
export class FfmpegMediaTranscoder implements MediaTranscoder {
  async probe(inputPath: string): Promise<MediaMetadata> {
    const { stdout } = await this.run('ffprobe', [
      '-v',
      'error',
      '-print_format',
      'json',
      '-show_format',
      '-show_streams',
      inputPath,
    ]);
    return parseProbe(stdout);
  }

  transcode(
    inputPath: string,
    outputPath: string,
    settings: EncodeSettings,
  ): Promise<void> {
    const { height, crf } = encodeProfile(settings.quality);
    const args = ['-y', '-i', inputPath, '-map', '0:v:0'];
    if (!settings.mute) {
      args.push('-map', '0:a:0?');
    }
    args.push(
      '-vf',
      videoFilter(height, settings.rotate),
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      String(crf),
    );
    if (settings.mute) {
      args.push('-an');
    } else {
      args.push('-c:a', 'aac');
    }
    args.push('-movflags', '+faststart', outputPath);
    return this.run('ffmpeg', args).then(() => undefined);
  }

  thumbnail(
    inputPath: string,
    outputPath: string,
    settings: EncodeSettings,
  ): Promise<void> {
    return this.run('ffmpeg', [
      '-y',
      '-ss',
      String(Math.max(0, settings.thumbnailOffsetSeconds)),
      '-i',
      inputPath,
      '-frames:v',
      '1',
      '-vf',
      thumbnailFilter(settings.rotate),
      outputPath,
    ]).then(() => undefined);
  }

  private run(command: string, args: string[]): Promise<{ stdout: string }> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString();
      });
      child.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });
      child.on('error', () => {
        reject(new PermanentMediaError(`${command} is not available`));
      });
      child.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout });
          return;
        }
        reject(
          new PermanentMediaError(
            stderr.trim().slice(-1500) || `${command} failed`,
          ),
        );
      });
    });
  }
}

function videoFilter(height: number, rotate: boolean): string {
  const scale = `scale=-2:min(${height}\\,trunc(ih/2)*2)`;
  return rotate ? `transpose=1,${scale}` : scale;
}

function thumbnailFilter(rotate: boolean): string {
  const scale = 'scale=min(640\\,iw):-2';
  return rotate ? `transpose=1,${scale}` : scale;
}

function parseProbe(stdout: string): MediaMetadata {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stdout) as unknown;
  } catch {
    throw new PermanentMediaError('ffprobe returned invalid metadata');
  }
  if (typeof parsed !== 'object' || parsed === null) {
    throw new PermanentMediaError('ffprobe returned invalid metadata');
  }
  const record = parsed as { streams?: unknown; format?: unknown };
  const streams = Array.isArray(record.streams) ? record.streams : [];
  const video = streams.find(
    (stream) =>
      typeof stream === 'object' &&
      stream !== null &&
      (stream as { codec_type?: unknown }).codec_type === 'video',
  ) as { width?: unknown; height?: unknown } | undefined;
  const format =
    typeof record.format === 'object' && record.format !== null
      ? (record.format as { duration?: unknown })
      : undefined;
  const width = Number(video?.width);
  const height = Number(video?.height);
  const durationSeconds = Number(format?.duration);
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    throw new PermanentMediaError('The file does not contain a video stream');
  }
  return {
    width,
    height,
    durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : 0,
  };
}
