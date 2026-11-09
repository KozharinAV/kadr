import {
  ConflictException,
  Inject,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { isRoleName } from '../../auth/domain/role-name';
import type { RoleName } from '../../auth/domain/role-name';
import { PASSWORD_HASHER } from '../../auth/application/password-hasher';
import type { PasswordHasher } from '../../auth/application/password-hasher';
import { toProfile, type UserProfile } from '../domain/user';
import { USER_REPOSITORY } from '../domain/user.repository';
import type { UserRepository } from '../domain/user.repository';

export interface CreateUserInput {
  email: string;
  password: string;
  role: string;
}

@Injectable()
export class CreateUser {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwords: PasswordHasher,
  ) {}

  async execute(input: CreateUserInput): Promise<UserProfile> {
    const email = normalizeEmail(input.email);
    const role = parseRole(input.role);
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new ConflictException('email_taken');
    }
    const user = await this.users.insert({
      email,
      role,
      passwordHash: await this.passwords.hash(input.password),
    });
    return toProfile(user);
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function parseRole(role: string): RoleName {
  if (!isRoleName(role)) {
    throw new BadRequestException('unknown_role');
  }
  return role;
}
