import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { Permission, isPermission } from '../../auth/domain/permission';
import { RoleName, isRoleName } from '../../auth/domain/role-name';
import {
  NewUser,
  User,
  UserChange,
  UserProfile,
  toProfile,
} from '../domain/user';
import {
  NewRefreshToken,
  StoredRefreshToken,
  UserRepository,
} from '../domain/user.repository';
import { RefreshTokenEntity } from './refresh-token.entity';
import { RolePermissionEntity } from './role-permission.entity';
import { RoleEntity } from './role.entity';
import { UserEntity } from './user.entity';

@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roles: Repository<RoleEntity>,
    @InjectRepository(RolePermissionEntity)
    private readonly permissions: Repository<RolePermissionEntity>,
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokens: Repository<RefreshTokenEntity>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.users.findOne({
      where: { email },
      relations: { role: true },
    });
    return entity ? this.toUser(entity) : null;
  }

  async findById(id: string): Promise<User | null> {
    const entity = await this.users.findOne({
      where: { id },
      relations: { role: true },
    });
    return entity ? this.toUser(entity) : null;
  }

  async list(): Promise<UserProfile[]> {
    const entities = await this.users.find({
      relations: { role: true },
      order: { email: 'ASC' },
    });
    const roleIds = [...new Set(entities.map((entity) => entity.role.id))];
    const permissionRows =
      roleIds.length === 0
        ? []
        : await this.permissions.find({ where: { roleId: In(roleIds) } });
    const permissionsByRole = new Map<string, Permission[]>();
    for (const row of permissionRows) {
      if (!isPermission(row.permission)) {
        continue;
      }
      const current = permissionsByRole.get(row.roleId) ?? [];
      current.push(row.permission);
      permissionsByRole.set(row.roleId, current);
    }
    return entities.map((entity) =>
      toProfile(this.mapUser(entity, permissionsByRole)),
    );
  }

  async insert(user: NewUser): Promise<User> {
    const role = await this.roles.findOne({ where: { name: user.role } });
    if (!role) {
      throw new Error(`Role ${user.role} is not seeded`);
    }
    const saved = await this.users.save(
      this.users.create({
        email: user.email,
        passwordHash: user.passwordHash,
        role,
      }),
    );
    return this.toUser(saved);
  }

  async update(id: string, change: UserChange): Promise<User | null> {
    const entity = await this.users.findOne({
      where: { id },
      relations: { role: true },
    });
    if (!entity) {
      return null;
    }
    const role = await this.roles.findOne({ where: { name: change.role } });
    if (!role) {
      throw new Error(`Role ${change.role} is not seeded`);
    }
    entity.email = change.email;
    entity.role = role;
    if (change.passwordHash) {
      entity.passwordHash = change.passwordHash;
    }
    return this.toUser(await this.users.save(entity));
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.users.delete({ id });
    return (result.affected ?? 0) > 0;
  }

  async countByRole(role: RoleName): Promise<number> {
    return this.users.count({ where: { role: { name: role } } });
  }

  async countOwnedVideos(userId: string): Promise<number> {
    const rows: { count: string }[] = await this.users.manager.query(
      'SELECT COUNT(*)::int AS count FROM videos WHERE owner_id = $1',
      [userId],
    );
    return Number(rows[0]?.count ?? 0);
  }

  async upsertRole(name: RoleName, permissions: Permission[]): Promise<void> {
    const existing = await this.roles.findOne({ where: { name } });
    const role =
      existing ?? (await this.roles.save(this.roles.create({ name })));
    await this.permissions.delete({ roleId: role.id });
    if (permissions.length === 0) {
      return;
    }
    await this.permissions.save(
      permissions.map((permission) =>
        this.permissions.create({ roleId: role.id, permission }),
      ),
    );
  }

  async saveRefreshToken(token: NewRefreshToken): Promise<void> {
    await this.refreshTokens.save(this.refreshTokens.create(token));
  }

  async findRefreshToken(jti: string): Promise<StoredRefreshToken | null> {
    return this.refreshTokens.findOne({ where: { jti } });
  }

  async revokeRefreshToken(jti: string): Promise<void> {
    await this.refreshTokens.update(
      { jti, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.refreshTokens.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  private async toUser(entity: UserEntity): Promise<User> {
    const rows = await this.permissions.find({
      where: { roleId: entity.role.id },
    });
    const permissions = new Map<string, Permission[]>([
      [entity.role.id, rows.map((row) => row.permission).filter(isPermission)],
    ]);
    return this.mapUser(entity, permissions);
  }

  private mapUser(
    entity: UserEntity,
    permissionsByRole: Map<string, Permission[]>,
  ): User {
    if (!isRoleName(entity.role.name)) {
      throw new Error(`Unknown role ${entity.role.name}`);
    }
    return {
      id: entity.id,
      email: entity.email,
      passwordHash: entity.passwordHash,
      role: entity.role.name,
      permissions: permissionsByRole.get(entity.role.id) ?? [],
    };
  }
}
