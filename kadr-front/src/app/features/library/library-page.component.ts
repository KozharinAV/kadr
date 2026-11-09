import { SelectionModel } from '@angular/cdk/collections';
import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { debounceTime, distinctUntilChanged, filter, map, switchMap } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { HasPermission } from '../../shared/directives/has-permission.directive';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog';
import { PageScaffold } from '../../shared/ui/page-scaffold.component';
import { StatusChip } from '../../shared/ui/status-chip.component';
import { VideoDialog } from '../video/video-dialog.component';
import { LibraryFacade } from './library.facade';
import { UploadDialog } from './upload-dialog.component';
import { formatDuration, VideoView } from './video.models';

@Component({
  selector: 'app-library-page',
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    TranslocoPipe,
    PageScaffold,
    StatusChip,
    HasPermission,
  ],
  templateUrl: './library-page.component.html',
  styleUrl: './library-page.component.scss',
})
export class LibraryPage {
  private readonly facade = inject(LibraryFacade);
  private readonly auth = inject(AuthService);
  private readonly confirm = inject(ConfirmDialog);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private player: MatDialogRef<VideoDialog> | null = null;
  private openId: string | null = null;

  readonly videos$ = this.facade.videos$;
  readonly user$ = this.auth.user$;
  readonly search = new FormControl('', { nonNullable: true });
  readonly appliedQuery = signal('');
  readonly selection = new SelectionModel<VideoView>(true, []);
  readonly duration = formatDuration;

  constructor() {
    this.search.valueChanges
      .pipe(
        debounceTime(300),
        map((value) => value.trim()),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe((query) => {
        this.appliedQuery.set(query);
        this.facade.setQuery(query);
      });
    this.videos$.pipe(takeUntilDestroyed()).subscribe((videos) => {
      const ids = new Set(videos.map((video) => video.id));
      for (const video of this.selection.selected) {
        if (!ids.has(video.id)) {
          this.selection.deselect(video);
        }
      }
    });
    this.destroyRef.onDestroy(() => {
      this.openId = null;
      this.player?.close();
    });
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const id = params.get('watch');
      if (!id || id === this.openId) {
        return;
      }
      this.openId = id;
      this.player = this.dialog.open(VideoDialog, {
        data: id,
        panelClass: 'video-dialog',
        width: 'min(960px, 92vw)',
        maxWidth: 'calc(100vw - 16px)',
        maxHeight: 'calc(100vh - 16px)',
        autoFocus: false,
      });
      this.player.afterClosed().subscribe(() => {
        this.player = null;
        if (this.openId !== id) {
          return;
        }
        this.openId = null;
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { watch: null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      });
    });
  }

  watch(video: VideoView): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { watch: video.id },
      queryParamsHandling: 'merge',
    });
  }

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = [...(input.files ?? [])];
    input.value = '';
    if (files.length === 0) {
      return;
    }
    this.dialog.open(UploadDialog, {
      data: { files },
      width: 'min(640px, 96vw)',
      maxWidth: 'calc(100vw - 16px)',
      maxHeight: 'calc(100vh - 32px)',
      autoFocus: false,
    });
  }

  portrait(video: VideoView): boolean {
    return video.width != null && video.height != null && video.height > video.width;
  }

  canDelete(video: VideoView, permissions: string[], userId: string): boolean {
    return permissions.includes('user.manage') || (permissions.includes('video.delete') && video.ownerId === userId);
  }

  deletable(videos: VideoView[], permissions: string[], userId: string): VideoView[] {
    return videos.filter((video) => this.canDelete(video, permissions, userId));
  }

  isSelected(video: VideoView): boolean {
    return this.selection.selected.some((item) => item.id === video.id);
  }

  allSelected(videos: VideoView[]): boolean {
    return videos.length > 0 && videos.every((video) => this.isSelected(video));
  }

  someSelected(videos: VideoView[]): boolean {
    return videos.some((video) => this.isSelected(video)) && !this.allSelected(videos);
  }

  toggle(video: VideoView): void {
    const current = this.selection.selected.find((item) => item.id === video.id);
    if (current) {
      this.selection.deselect(current);
      return;
    }
    this.selection.select(video);
  }

  toggleAll(videos: VideoView[]): void {
    if (this.allSelected(videos)) {
      for (const video of videos) {
        const current = this.selection.selected.find((item) => item.id === video.id);
        if (current) {
          this.selection.deselect(current);
        }
      }
      return;
    }
    for (const video of videos) {
      if (!this.isSelected(video)) {
        this.selection.select(video);
      }
    }
  }

  remove(video: VideoView): void {
    this.confirm
      .open('library.deleteTitle', 'library.deleteMessage')
      .pipe(
        filter((confirmed) => confirmed),
        switchMap(() => this.facade.remove(video.id)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.drop(video));
  }

  removeSelected(videos: VideoView[]): void {
    const chosen = videos.filter((video) => this.isSelected(video));
    if (chosen.length === 0) {
      return;
    }
    const messageKey = chosen.length === 1 ? 'library.deleteMessage' : 'library.deleteMany';
    const params = chosen.length === 1 ? undefined : { count: String(chosen.length) };
    this.confirm
      .open('library.deleteTitle', messageKey, params)
      .pipe(
        filter((confirmed) => confirmed),
        switchMap(() => this.facade.removeMany(chosen.map((video) => video.id))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        for (const video of chosen) {
          this.drop(video);
        }
      });
  }

  private drop(video: VideoView): void {
    const current = this.selection.selected.find((item) => item.id === video.id);
    if (current) {
      this.selection.deselect(current);
    }
  }

  retry(video: VideoView): void {
    this.facade.retry(video.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }
}
