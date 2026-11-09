import { Injectable } from '@nestjs/common';
import {
  collectDefaultMetrics,
  Counter,
  Gauge,
  Histogram,
  Registry,
} from 'prom-client';

@Injectable()
export class AppMetrics {
  readonly registry = new Registry();
  readonly httpDuration: Histogram<string>;
  readonly transcodeDuration: Histogram<string>;
  readonly transcodeJobs: Counter<string>;
  readonly queueJobs: Gauge<string>;

  constructor() {
    this.registry.setDefaultLabels({ app: 'kadr' });
    collectDefaultMetrics({ register: this.registry });
    this.httpDuration = new Histogram({
      name: 'kadr_http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.01, 0.05, 0.1, 0.3, 1, 3, 10],
      registers: [this.registry],
    });
    this.transcodeDuration = new Histogram({
      name: 'kadr_transcode_duration_seconds',
      help: 'One FFmpeg attempt duration in seconds',
      buckets: [1, 5, 15, 30, 60, 180, 600],
      registers: [this.registry],
    });
    this.transcodeJobs = new Counter({
      name: 'kadr_transcode_jobs_total',
      help: 'Transcode attempts by outcome',
      labelNames: ['result'],
      registers: [this.registry],
    });
    this.queueJobs = new Gauge({
      name: 'kadr_queue_jobs',
      help: 'Jobs currently in the transcode queue',
      labelNames: ['state'],
      registers: [this.registry],
    });
  }
}
