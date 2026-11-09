import { InjectQueue } from '@nestjs/bullmq';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Queue } from 'bullmq';
import { TRANSCODE_QUEUE_NAME } from '../transcode/domain/transcode-job-data';
import { AppMetrics } from './app-metrics';

const SAMPLE_INTERVAL_MS = 15_000;

@Injectable()
export class QueueMetrics implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueMetrics.name);
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly metrics: AppMetrics,
    @InjectQueue(TRANSCODE_QUEUE_NAME) private readonly queue: Queue,
  ) {}

  onModuleInit(): void {
    void this.sample();
    this.timer = setInterval(() => void this.sample(), SAMPLE_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private async sample(): Promise<void> {
    try {
      const counts = await this.queue.getJobCounts(
        'waiting',
        'active',
        'delayed',
        'failed',
      );
      for (const state of ['waiting', 'active', 'delayed', 'failed'] as const) {
        this.metrics.queueJobs.set({ state }, counts[state] ?? 0);
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'queue sample failed';
      this.logger.warn(message);
    }
  }
}
