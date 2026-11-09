import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AppConfigModule } from '../../config/app-config.module';
import { UsersModule } from '../users/users.module';
import { EnsureAccessSeed } from './application/ensure-access-seed';
import { IssueSession } from './application/issue-session';
import { LoginUser } from './application/login-user';
import { LogoutUser } from './application/logout-user';
import { RefreshSession } from './application/refresh-session';
import { TOKEN_SERVICE } from './application/token.service';
import { JwtStrategy } from './infrastructure/jwt.strategy';
import { JwtTokenService } from './infrastructure/jwt-token.service';
import { PasswordModule } from './password.module';
import { AuthController } from './presentation/auth.controller';

@Module({
  imports: [
    AppConfigModule,
    PasswordModule,
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    LoginUser,
    RefreshSession,
    LogoutUser,
    IssueSession,
    EnsureAccessSeed,
    JwtStrategy,
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AuthModule {}
