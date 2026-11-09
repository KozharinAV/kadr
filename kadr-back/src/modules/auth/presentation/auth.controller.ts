import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Public } from '../../../common/decorators/public.decorator';
import { LoginUser } from '../application/login-user';
import { LogoutUser } from '../application/logout-user';
import { RefreshSession } from '../application/refresh-session';
import { AuthTokens } from '../application/token.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUser: LoginUser,
    private readonly refreshSession: RefreshSession,
    private readonly logoutUser: LogoutUser,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto): Promise<AuthTokens> {
    return this.loginUser.execute(dto.email, dto.password);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshDto): Promise<AuthTokens> {
    return this.refreshSession.execute(dto.refreshToken);
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  logout(@Body() dto: RefreshDto): Promise<void> {
    return this.logoutUser.execute(dto.refreshToken);
  }
}
