import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { APP_CONFIG } from '../../../config/read-config';
import type { AppConfig } from '../../../config/read-config';
import type { User } from '../../users/domain/user';
import { isRoleName } from '../domain/role-name';
import { isPermission } from '../domain/permission';
import type {
  AccessPayload,
  RefreshPayload,
  SignedRefreshToken,
  TokenService,
} from '../application/token.service';

@Injectable()
export class JwtTokenService implements TokenService {
  constructor(
    private readonly jwt: JwtService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  signAccess(user: User): Promise<string> {
    const payload: AccessPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    };
    return this.jwt.signAsync(payload, {
      secret: this.config.jwt.accessSecret,
      expiresIn: this.config.jwt.accessTtlSeconds,
    });
  }

  async signRefresh(userId: string, jti: string): Promise<SignedRefreshToken> {
    const payload: RefreshPayload = { sub: userId, jti };
    const token = await this.jwt.signAsync(payload, {
      secret: this.config.jwt.refreshSecret,
      expiresIn: this.config.jwt.refreshTtlSeconds,
    });
    return {
      token,
      expiresAt: new Date(
        Date.now() + this.config.jwt.refreshTtlSeconds * 1000,
      ),
    };
  }

  async verifyRefresh(token: string): Promise<RefreshPayload> {
    const payload: unknown = await this.jwt.verifyAsync(token, {
      secret: this.config.jwt.refreshSecret,
    });
    if (!isRefreshPayload(payload)) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return payload;
  }
}

function isRefreshPayload(value: unknown): value is RefreshPayload {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record.sub === 'string' && typeof record.jti === 'string';
}

export function isAccessPayload(value: unknown): value is AccessPayload {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.sub === 'string' &&
    typeof record.email === 'string' &&
    typeof record.role === 'string' &&
    isRoleName(record.role) &&
    Array.isArray(record.permissions) &&
    record.permissions.every(
      (item) => typeof item === 'string' && isPermission(item),
    )
  );
}
