import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { UploadOptions, VideoView } from './video.models';

@Injectable({ providedIn: 'root' })
export class VideosApi {
  private readonly http = inject(HttpClient);

  list(query = ''): Observable<VideoView[]> {
    const params = query ? { q: query } : undefined;
    return this.http.get<VideoView[]>('/api/videos', { params });
  }

  get(id: string): Observable<VideoView> {
    return this.http.get<VideoView>(`/api/videos/${id}`);
  }

  upload(file: File, options: UploadOptions): Observable<VideoView> {
    const body = new FormData();
    body.append('file', file);
    body.append('title', options.title);
    body.append('quality', options.quality);
    body.append('rotate', String(options.rotate));
    body.append('mute', String(options.mute));
    body.append('thumbnailOffset', String(options.thumbnailOffset));
    return this.http.post<VideoView>('/api/videos', body);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`/api/videos/${id}`);
  }

  retry(id: string): Observable<VideoView> {
    return this.http.post<VideoView>(`/api/videos/${id}/retry`, {});
  }
}
