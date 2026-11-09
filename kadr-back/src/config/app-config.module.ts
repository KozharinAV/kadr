import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_CONFIG, configFromService } from './read-config';

@Global()
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [
    {
      provide: APP_CONFIG,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        configFromService((key) => config.get<string>(key)),
    },
  ],
  exports: [APP_CONFIG],
})
export class AppConfigModule {}
