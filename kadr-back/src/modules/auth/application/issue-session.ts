import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { USER_REPOSITORY } from '../../users/domain/user.repository';
import type { UserRepository } from '../../users/domain/user.repository';
import type { User } from '../../users/domain/user';
import { TOKEN_SERVICE } from './token.service';
import type { AuthTokens, TokenService } from './token.service';
import { hashToken } from './token-hash';

@Injectable()
export class IssueSession {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
  ) {}

  async execute(user: User): Promise<AuthTokens> {
    const jti = randomUUID();
    const accessToken = await this.tokens.signAccess(user);
    const refresh = await this.tokens.signRefresh(user.id, jti);
    await this.users.saveRefreshToken({
      jti,
      userId: user.id,
      tokenHash: hashToken(refresh.token),
      expiresAt: refresh.expiresAt,
    });
    return { accessToken, refreshToken: refresh.token };
  }
}
