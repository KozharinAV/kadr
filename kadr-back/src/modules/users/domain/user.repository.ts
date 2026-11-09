import { Permission } from '../../auth/domain/permission';
import { RoleName } from '../../auth/domain/role-name';
import { NewUser, User, UserChange, UserProfile } from './user';

export interface StoredRefreshToken {
  jti: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface NewRefreshToken {
  jti: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  list(): Promise<UserProfile[]>;
  insert(user: NewUser): Promise<User>;
  update(id: string, change: UserChange): Promise<User | null>;
  delete(id: string): Promise<boolean>;
  countByRole(role: RoleName): Promise<number>;
  countOwnedVideos(userId: string): Promise<number>;
  upsertRole(name: RoleName, permissions: Permission[]): Promise<void>;
  saveRefreshToken(token: NewRefreshToken): Promise<void>;
  findRefreshToken(jti: string): Promise<StoredRefreshToken | null>;
  revokeRefreshToken(jti: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
