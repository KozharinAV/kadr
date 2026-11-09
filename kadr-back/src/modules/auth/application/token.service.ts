import { User } from '../../users/domain/user';
import { Permission } from '../domain/permission';
import { RoleName } from '../domain/role-name';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AccessPayload {
  sub: string;
  email: string;
  role: RoleName;
  permissions: Permission[];
}

export interface RefreshPayload {
  sub: string;
  jti: string;
}

export interface SignedRefreshToken {
  token: string;
  expiresAt: Date;
}

export interface TokenService {
  signAccess(user: User): Promise<string>;
  signRefresh(userId: string, jti: string): Promise<SignedRefreshToken>;
  verifyRefresh(token: string): Promise<RefreshPayload>;
}

export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');
