import { Injectable, inject } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  Subject,
  catchError,
  combineLatest,
  concat,
  finalize,
  map,
  merge,
  of,
  shareReplay,
  switchMap,
  tap,
  timer,
} from 'rxjs';
import { UploadOptions, VideoView } from './video.models';
import { VideosApi } from './videos.api';

@Injectable({ providedIn: 'root' })
export class LibraryFacade {
  private readonly api = inject(VideosApi);
  private readonly refresh$ = new Subject<void>();
  private readonly query$ = new BehaviorSubject('');

  readonly videos$: Observable<VideoView[]> = combineLatest([
    merge(timer(0, 4000), this.refresh$),
    this.query$,
  ]).pipe(
    switchMap(([, query]) => this.api.list(query)),
    catchError(() => of([] as VideoView[])),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  setQuery(query: string): void {
    this.query$.next(query.trim());
  }

  refresh(): void {
    this.refresh$.next();
  }

  upload(file: File, options: UploadOptions): Observable<VideoView> {
    return this.api.upload(file, options).pipe(tap(() => this.refresh()));
  }

  remove(id: string): Observable<void> {
    return this.api.remove(id).pipe(tap(() => this.refresh()));
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

  retry(id: string): Observable<VideoView> {
    return this.api.retry(id).pipe(tap(() => this.refresh()));
  }
}
