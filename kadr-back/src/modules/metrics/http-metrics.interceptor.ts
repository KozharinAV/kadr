import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { AppMetrics } from './app-metrics';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: AppMetrics) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    if (request.path.endsWith('/metrics')) {
      return next.handle();
    }
    const started = process.hrtime.bigint();
    const record = (status: number): void => {
      const route = routeOf(request);
      this.metrics.httpDuration.observe(
        { method: request.method, route, status: String(status) },
        Number(process.hrtime.bigint() - started) / 1e9,
      );
    };
    return next.handle().pipe(
      tap(() => record(response.statusCode)),
      catchError((error: unknown) => {
        record(error instanceof HttpException ? error.getStatus() : 500);
        return throwError(() => error);
      }),
    );
  }
}

function routeOf(request: Request): string {
  const route: unknown = request.route;
  if (
    typeof route === 'object' &&
    route !== null &&
    'path' in route &&
    typeof route.path === 'string'
  ) {
    return route.path;
  }
  return 'unknown';
}
