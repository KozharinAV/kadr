import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import { Job, UnrecoverableError } from 'bullmq';
import { VIDEO_REPOSITORY } from '../videos/domain/video.repository';
import type { VideoRepository } from '../videos/domain/video.repository';
import { RunTranscode } from './application/run-transcode';
import { TRANSCODE_QUEUE_NAME } from './domain/transcode-job-data';
import type { TranscodeJobData } from './domain/transcode-job-data';
import { PermanentMediaError } from './domain/permanent-media-error';
import { AppMetrics } from '../metrics/app-metrics';

@Processor(TRANSCODE_QUEUE_NAME, { concurrency: 1 })
export class TranscodeProcessor extends WorkerHost {
  constructor(
    private readonly transcode: RunTranscode,
    @Inject(VIDEO_REPOSITORY) private readonly videos: VideoRepository,
    private readonly metrics: AppMetrics,
  ) {
    super();
  }

  async process(job: Job<TranscodeJobData>): Promise<void> {
    const started = process.hrtime.bigint();
    try {
      await this.transcode.execute(job.data.videoId);
      this.metrics.transcodeJobs.inc({ result: 'done' });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Transcode failed';
      const attempts = job.opts.attempts ?? 1;
      const permanent = error instanceof PermanentMediaError;
      if (permanent || job.attemptsMade >= attempts) {
        await this.videos.markFailed(job.data.videoId, message);
      }
      this.metrics.transcodeJobs.inc({
        result: permanent ? 'rejected' : 'retry',
      });
      if (permanent) {
        throw new UnrecoverableError(message);
      }
      throw error;
    } finally {
      this.metrics.transcodeDuration.observe(
        Number(process.hrtime.bigint() - started) / 1e9,
      );
    }
  }
}
