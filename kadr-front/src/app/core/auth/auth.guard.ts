import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs';
import { AuthService } from './auth.service';
import { TokenStorage } from './token-storage';

export const authGuard: CanActivateFn = () => {
  const tokens = inject(TokenStorage);
  const router = inject(Router);
  if (tokens.accessToken()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = () => {
  const tokens = inject(TokenStorage);
  const router = inject(Router);
  if (tokens.accessToken()) {
    return router.createUrlTree(['/library']);
  }
  return true;
};

export const permissionGuard = (permission: string): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    return auth.user$.pipe(
      take(1),
      map((user) =>
        user?.permissions.includes(permission) ? true : router.createUrlTree(['/library']),
      ),
    );
  };
};
