import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { TranscodeQueueModule } from '../transcode/transcode-queue.module';
import { AppMetrics } from './app-metrics';
import { HealthController } from './health.controller';
import { HttpMetricsInterceptor } from './http-metrics.interceptor';
import { MetricsController } from './metrics.controller';
import { QueueMetrics } from './queue-metrics';

@Module({
  imports: [TerminusModule, TranscodeQueueModule],
  controllers: [HealthController, MetricsController],
  providers: [
    AppMetrics,
    QueueMetrics,
    { provide: APP_INTERCEPTOR, useClass: HttpMetricsInterceptor },
  ],
  exports: [AppMetrics],
})
export class MetricsModule {}
