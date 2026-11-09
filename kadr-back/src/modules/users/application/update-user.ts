import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PASSWORD_HASHER } from '../../auth/application/password-hasher';
import type { PasswordHasher } from '../../auth/application/password-hasher';
import { toProfile, type UserProfile } from '../domain/user';
import { USER_REPOSITORY } from '../domain/user.repository';
import type { UserRepository } from '../domain/user.repository';
import { normalizeEmail, parseRole } from './create-user';

export interface UpdateUserInput {
  email: string;
  password?: string;
  role: string;
}

@Injectable()
export class UpdateUser {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwords: PasswordHasher,
  ) {}

  async execute(id: string, input: UpdateUserInput): Promise<UserProfile> {
    const current = await this.users.findById(id);
    if (!current) {
      throw new NotFoundException('user_not_found');
    }
    const email = normalizeEmail(input.email);
    const role = parseRole(input.role);
    const taken = await this.users.findByEmail(email);
    if (taken && taken.id !== id) {
      throw new ConflictException('email_taken');
    }
    if (current.role === 'admin' && role !== 'admin') {
      await this.keepLastAdmin();
    }
    const passwordHash = input.password
      ? await this.passwords.hash(input.password)
      : undefined;
    const updated = await this.users.update(id, { email, role, passwordHash });
    if (!updated) {
      throw new NotFoundException('user_not_found');
    }
    if (passwordHash) {
      await this.users.revokeAllForUser(id);
    }
    return toProfile(updated);
  }

  private async keepLastAdmin(): Promise<void> {
    const admins = await this.users.countByRole('admin');
    if (admins <= 1) {
      throw new ConflictException('last_admin');
    }
  }
}
