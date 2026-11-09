import { Injectable } from '@angular/core';
import { AuthTokens } from './auth.models';

const ACCESS_KEY = 'kadr.access';
const REFRESH_KEY = 'kadr.refresh';

@Injectable({ providedIn: 'root' })
export class TokenStorage {
  accessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  }

  refreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  }

  save(tokens: AuthTokens): void {
    localStorage.setItem(ACCESS_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  }

  clear(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }
}
