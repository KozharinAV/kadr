import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  TRANSCODE_QUEUE_NAME,
  TranscodeJobData,
} from '../domain/transcode-job-data';
import { TranscodeQueue } from '../domain/transcode-queue';

@Injectable()
export class BullTranscodeQueue implements TranscodeQueue {
  constructor(
    @InjectQueue(TRANSCODE_QUEUE_NAME)
    private readonly jobs: Queue<TranscodeJobData>,
  ) {}

  async enqueue(videoId: string): Promise<void> {
    await this.jobs.add(
      'run',
      { videoId },
      {
        jobId: `${videoId}-${Date.now()}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: 50,
        removeOnFail: 50,
      },
    );
  }
}
