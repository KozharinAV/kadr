import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { AppMetrics } from './app-metrics';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: AppMetrics) {}

  @Public()
  @Get()
  async scrape(@Res() response: Response): Promise<void> {
    response.setHeader('Content-Type', this.metrics.registry.contentType);
    response.send(await this.metrics.registry.metrics());
  }
}
