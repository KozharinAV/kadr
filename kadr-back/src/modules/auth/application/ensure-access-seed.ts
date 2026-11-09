import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { APP_CONFIG } from '../../../config/read-config';
import type { AppConfig } from '../../../config/read-config';
import { USER_REPOSITORY } from '../../users/domain/user.repository';
import type { UserRepository } from '../../users/domain/user.repository';
import { ROLE_NAMES, ROLE_PERMISSIONS } from '../domain/role-name';
import { PASSWORD_HASHER } from './password-hasher';
import type { PasswordHasher } from './password-hasher';

@Injectable()
export class EnsureAccessSeed implements OnModuleInit {
  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwords: PasswordHasher,
  ) {}

  async onModuleInit(): Promise<void> {
    for (const role of ROLE_NAMES) {
      await this.users.upsertRole(role, ROLE_PERMISSIONS[role]);
    }

    const existing = await this.users.findByEmail(this.config.admin.email);
    if (existing) {
      return;
    }

    const passwordHash = await this.passwords.hash(this.config.admin.password);
    await this.users.insert({
      email: this.config.admin.email,
      passwordHash,
      role: 'admin',
    });
  }
}
