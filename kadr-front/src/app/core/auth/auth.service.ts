import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, finalize, map, of, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { AuthApi } from './auth.api';
import { UserProfile } from './auth.models';
import { TokenStorage } from './token-storage';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(AuthApi);
  private readonly tokens = inject(TokenStorage);
  private readonly userSubject = new BehaviorSubject<UserProfile | null>(null);
  private refreshInFlight: Observable<void> | null = null;

  readonly user$ = this.userSubject.asObservable();

  bootstrap(): Observable<UserProfile | null> {
    if (!this.tokens.refreshToken() && !this.tokens.accessToken()) {
      this.userSubject.next(null);
      return of(null);
    }

    return this.loadProfile().pipe(
      catchError(() => {
        if (!this.tokens.refreshToken()) {
          this.clearSession();
          return of(null);
        }
        return this.refresh().pipe(
          switchMap(() => this.loadProfile()),
          catchError(() => {
            this.clearSession();
            return of(null);
          }),
        );
      }),
    );
  }

  login(email: string, password: string): Observable<UserProfile> {
    return this.api.login(email, password).pipe(
      tap((tokens) => this.tokens.save(tokens)),
      switchMap(() => this.loadProfile()),
    );
  }

  refresh(): Observable<void> {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }

    const refreshToken = this.tokens.refreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('Refresh token is missing'));
    }

    this.refreshInFlight = this.api.refresh(refreshToken).pipe(
      tap((tokens) => this.tokens.save(tokens)),
      map(() => undefined),
      finalize(() => {
        this.refreshInFlight = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.refreshInFlight;
  }

  refreshProfile(): Observable<UserProfile> {
    return this.loadProfile();
  }

  logout(): Observable<void> {
    const refreshToken = this.tokens.refreshToken();
    const request = refreshToken ? this.api.logout(refreshToken) : of(undefined);
    return request.pipe(
      catchError(() => of(undefined)),
      tap(() => this.clearSession()),
    );
  }

  private clearSession(): void {
    this.tokens.clear();
    this.userSubject.next(null);
  }

  private loadProfile(): Observable<UserProfile> {
    return this.api.me().pipe(tap((user) => this.userSubject.next(user)));
  }
}
