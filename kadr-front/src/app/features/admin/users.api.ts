import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { UserProfile } from '../../core/auth/auth.models';

export type UserRole = UserProfile['role'];

export interface UserDraft {
  email: string;
  role: UserRole;
  password?: string;
}

@Injectable({ providedIn: 'root' })
export class UsersApi {
  private readonly http = inject(HttpClient);

  list(): Observable<UserProfile[]> {
    return this.http.get<UserProfile[]>('/api/users');
  }

  create(draft: UserDraft): Observable<UserProfile> {
    return this.http.post<UserProfile>('/api/users', draft);
  }

  update(id: string, draft: UserDraft): Observable<UserProfile> {
    return this.http.patch<UserProfile>(`/api/users/${id}`, draft);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`/api/users/${id}`);
  }
}
