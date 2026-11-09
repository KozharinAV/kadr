import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

interface ApiErrorBody {
  code: string;
  message: string;
  details: string[] | null;
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const raw: unknown = exception.getResponse();
      response.status(status).json(this.toBody(status, raw, exception.message));
      return;
    }

    this.logger.error(exception);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
      details: null,
    } satisfies ApiErrorBody);
  }

  private toBody(status: number, raw: unknown, fallback: string): ApiErrorBody {
    const code = HttpStatus[status] ?? 'ERROR';
    if (typeof raw === 'string') {
      return { code, message: raw, details: null };
    }
    if (typeof raw !== 'object' || raw === null || !('message' in raw)) {
      return { code, message: fallback, details: null };
    }

    const message = raw.message;
    if (typeof message === 'string') {
      return { code, message, details: null };
    }
    if (
      Array.isArray(message) &&
      message.every((item) => typeof item === 'string')
    ) {
      return {
        code,
        message: message[0] ?? fallback,
        details: message,
      };
    }
    return { code, message: fallback, details: null };
  }
}
