import { Injectable, inject } from '@angular/core';
import { Observable, Subject, catchError, concat, finalize, map, of, shareReplay, startWith, switchMap, tap } from 'rxjs';
import { UserProfile } from '../../core/auth/auth.models';
import { UserDraft, UsersApi } from './users.api';

export interface UsersViewState {
  users: UserProfile[];
  error: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminUsersFacade {
  private readonly api = inject(UsersApi);
  private readonly refresh$ = new Subject<void>();

  readonly state$: Observable<UsersViewState> = this.refresh$.pipe(
    startWith(undefined),
    switchMap(() =>
      this.api.list().pipe(
        map((users) => ({ users, error: false })),
        catchError(() => of({ users: [], error: true })),
      ),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  refresh(): void {
    this.refresh$.next();
  }

  create(draft: UserDraft): Observable<UserProfile> {
    return this.api.create(draft).pipe(tap(() => this.refresh()));
  }

  update(id: string, draft: UserDraft): Observable<UserProfile> {
    return this.api.update(id, draft).pipe(tap(() => this.refresh()));
  }

  removeMany(ids: string[]): Observable<void> {
    if (ids.length === 0) {
      return of(undefined);
    }
    return concat(...ids.map((id) => this.api.remove(id))).pipe(
      finalize(() => this.refresh()),
      map(() => undefined),
    );
  }
}
