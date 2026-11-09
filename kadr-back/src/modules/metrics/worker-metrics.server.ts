import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { createServer, type Server } from 'http';
import { AppMetrics } from './app-metrics';

@Injectable()
export class WorkerMetricsServer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WorkerMetricsServer.name);
  private server?: Server;

  constructor(private readonly metrics: AppMetrics) {}

  onModuleInit(): void {
    const port = Number(process.env.METRICS_PORT ?? 3001);
    this.server = createServer((request, response) => {
      if (request.url !== '/metrics') {
        response.statusCode = 404;
        response.end();
        return;
      }
      void this.metrics.registry.metrics().then((body) => {
        response.setHeader('Content-Type', this.metrics.registry.contentType);
        response.end(body);
      });
    });
    this.server.listen(port, () => {
      this.logger.log(`Worker metrics on :${port}/metrics`);
    });
  }

  onModuleDestroy(): void {
    this.server?.close();
  }
}
