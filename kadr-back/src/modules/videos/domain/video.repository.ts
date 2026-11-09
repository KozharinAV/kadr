import { NewVideo, TranscodeResult, Video } from './video';

export interface VideoRepository {
  insertQueued(video: NewVideo): Promise<Video>;
  listAll(title?: string): Promise<Video[]>;
  listReady(title?: string): Promise<Video[]>;
  listOwnOrReady(ownerId: string, title?: string): Promise<Video[]>;
  findById(id: string): Promise<Video | null>;
  markProcessing(id: string): Promise<void>;
  markDone(id: string, result: TranscodeResult): Promise<void>;
  markFailed(id: string, reason: string): Promise<void>;
  requeue(id: string): Promise<void>;
  delete(id: string): Promise<void>;
}

export const VIDEO_REPOSITORY = Symbol('VIDEO_REPOSITORY');
