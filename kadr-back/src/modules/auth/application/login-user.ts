import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PASSWORD_HASHER } from './password-hasher';
import type { PasswordHasher } from './password-hasher';
import { IssueSession } from './issue-session';
import type { AuthTokens } from './token.service';
import { USER_REPOSITORY } from '../../users/domain/user.repository';
import type { UserRepository } from '../../users/domain/user.repository';

@Injectable()
export class LoginUser {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwords: PasswordHasher,
    private readonly sessions: IssueSession,
  ) {}

  async execute(email: string, password: string): Promise<AuthTokens> {
    const user = await this.users.findByEmail(email.trim().toLowerCase());
    const passwordMatches = user
      ? await this.passwords.verify(password, user.passwordHash)
      : false;
    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.sessions.execute(user);
  }
}
