import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { USER_REPOSITORY } from '../../users/domain/user.repository';
import type { UserRepository } from '../../users/domain/user.repository';
import { hashToken, safeEqual } from './token-hash';
import { IssueSession } from './issue-session';
import { TOKEN_SERVICE } from './token.service';
import type { AuthTokens, TokenService } from './token.service';

@Injectable()
export class RefreshSession {
  constructor(
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly sessions: IssueSession,
  ) {}

  async execute(refreshToken: string): Promise<AuthTokens> {
    const payload = await this.tokens.verifyRefresh(refreshToken).catch(() => {
      throw new UnauthorizedException('Invalid refresh token');
    });
    const stored = await this.users.findRefreshToken(payload.jti);
    const tokenHash = hashToken(refreshToken);
    if (
      !stored ||
      !safeEqual(stored.tokenHash, tokenHash) ||
      stored.revokedAt !== null ||
      stored.expiresAt.getTime() <= Date.now()
    ) {
      if (stored) {
        await this.users.revokeAllForUser(stored.userId);
      }
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.users.revokeRefreshToken(stored.jti);
    const user = await this.users.findById(stored.userId);
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return this.sessions.execute(user);
  }
}
