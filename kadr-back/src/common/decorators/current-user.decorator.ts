import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { UserProfile } from '../../modules/users/domain/user';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserProfile => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user?: UserProfile }>();
    if (!request.user) {
      throw new UnauthorizedException();
    }
    return request.user;
  },
);
