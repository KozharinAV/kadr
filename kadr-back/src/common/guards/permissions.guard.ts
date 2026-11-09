import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { Permission } from '../../modules/auth/domain/permission';
import type { UserProfile } from '../../modules/users/domain/user';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required?.length) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: UserProfile }>();
    const permissions = request.user?.permissions ?? [];
    return required.every((permission) => permissions.includes(permission));
  }
}
