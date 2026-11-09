import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../users/domain/user.repository';
import type { UserRepository } from '../../users/domain/user.repository';
import { TOKEN_SERVICE } from './token.service';
import type { TokenService } from './token.service';

@Injectable()
export class LogoutUser {
  constructor(
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(refreshToken: string): Promise<void> {
    try {
      const payload = await this.tokens.verifyRefresh(refreshToken);
      await this.users.revokeRefreshToken(payload.jti);
    } catch {
      return;
    }
  }
}
