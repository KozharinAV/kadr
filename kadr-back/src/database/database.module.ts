import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigModule } from '../config/app-config.module';
import { APP_CONFIG } from '../config/read-config';
import type { AppConfig } from '../config/read-config';
import { InitAuth1762300800000 } from './migrations/1762300800000-init-auth';
import { VideoEncode1762502400000 } from './migrations/1762502400000-video-encode';
import { Videos1762400000000 } from './migrations/1762400000000-videos';

@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forRootAsync({
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => ({
        type: 'postgres' as const,
        url: config.databaseUrl,
        autoLoadEntities: true,
        synchronize: false,
        migrations: [
          InitAuth1762300800000,
          Videos1762400000000,
          VideoEncode1762502400000,
        ],
        migrationsRun: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
