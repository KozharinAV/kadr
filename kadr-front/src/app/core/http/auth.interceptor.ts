import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { TokenStorage } from '../auth/token-storage';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api') || req.url.startsWith('/api/auth/')) {
    return next(req);
  }

  const tokens = inject(TokenStorage);
  const auth = inject(AuthService);
  const accessToken = tokens.accessToken();
  const authorized = accessToken
    ? req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
    : req;

  return next(authorized).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || req.headers.has('X-Retry')) {
        return throwError(() => error);
      }

      return auth.refresh().pipe(
        switchMap(() => {
          const refreshed = tokens.accessToken();
          return next(
            req.clone({
              setHeaders: {
                Authorization: `Bearer ${refreshed ?? ''}`,
                'X-Retry': '1',
              },
            }),
          );
        }),
      );
    }),
  );
};
