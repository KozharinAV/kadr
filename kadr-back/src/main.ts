import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import { APP_CONFIG } from './config/read-config';
import type { AppConfig } from './config/read-config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({ origin: ['http://localhost:4200', 'http://localhost'] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());
  const config = app.get<AppConfig>(APP_CONFIG);
  await app.listen(config.port);
}

bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
