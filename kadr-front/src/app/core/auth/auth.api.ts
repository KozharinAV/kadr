import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthTokens, UserProfile } from './auth.models';
import { TokenStorage } from './token-storage';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = new HttpClient(inject(HttpBackend));
  private readonly tokens = inject(TokenStorage);

  login(email: string, password: string): Observable<AuthTokens> {
    return this.http.post<AuthTokens>('/api/auth/login', { email, password });
  }

  refresh(refreshToken: string): Observable<AuthTokens> {
    return this.http.post<AuthTokens>('/api/auth/refresh', { refreshToken });
  }

  logout(refreshToken: string): Observable<void> {
    return this.http.post<void>('/api/auth/logout', { refreshToken });
  }

  me(): Observable<UserProfile> {
    const accessToken = this.tokens.accessToken();
    return this.http.get<UserProfile>('/api/users/me', {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
  }
}
