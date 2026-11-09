export interface TranscodeQueue {
  enqueue(videoId: string): Promise<void>;
}

export const TRANSCODE_QUEUE = Symbol('TRANSCODE_QUEUE');
