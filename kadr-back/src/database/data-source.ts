import 'dotenv/config';
import { DataSource } from 'typeorm';
import { readConfig } from '../config/read-config';
import { RefreshTokenEntity } from '../modules/users/infrastructure/refresh-token.entity';
import { RolePermissionEntity } from '../modules/users/infrastructure/role-permission.entity';
import { RoleEntity } from '../modules/users/infrastructure/role.entity';
import { UserEntity } from '../modules/users/infrastructure/user.entity';
import { TranscodeJobEntity } from '../modules/videos/infrastructure/transcode-job.entity';
import { VideoEntity } from '../modules/videos/infrastructure/video.entity';
import { InitAuth1762300800000 } from './migrations/1762300800000-init-auth';
import { VideoEncode1762502400000 } from './migrations/1762502400000-video-encode';
import { Videos1762400000000 } from './migrations/1762400000000-videos';

const config = readConfig(process.env);

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: config.databaseUrl,
  entities: [
    UserEntity,
    RoleEntity,
    RolePermissionEntity,
    RefreshTokenEntity,
    VideoEntity,
    TranscodeJobEntity,
  ],
  migrations: [
    InitAuth1762300800000,
    Videos1762400000000,
    VideoEncode1762502400000,
  ],
});
