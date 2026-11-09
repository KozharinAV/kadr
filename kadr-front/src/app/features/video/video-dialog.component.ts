import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, ElementRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoPipe } from '@jsverse/transloco';
import { debounceTime, fromEvent, startWith, Subject, switchMap, takeWhile, tap, timer } from 'rxjs';
import { HasPermission } from '../../shared/directives/has-permission.directive';
import { StatusChip } from '../../shared/ui/status-chip.component';
import { LibraryFacade } from '../library/library.facade';
import { formatDuration } from '../library/video.models';
import { VideosApi } from '../library/videos.api';

@Component({
  selector: 'app-video-dialog',
  imports: [AsyncPipe, MatButtonModule, MatDialogModule, MatTooltipModule, TranslocoPipe, StatusChip, HasPermission],
  templateUrl: './video-dialog.component.html',
  styleUrl: './video-dialog.component.scss',
})
export class VideoDialog {
  private readonly api = inject(VideosApi);
  private readonly facade = inject(LibraryFacade);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogRef = inject(MatDialogRef<VideoDialog>);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly reload$ = new Subject<void>();
  private ratio: number | null = null;
  private appliedWidth = 0;
  private viewportW = 0;
  private viewportH = 0;

  readonly id = inject<string>(MAT_DIALOG_DATA);
  readonly duration = formatDuration;
  readonly video$ = this.reload$.pipe(
    startWith(undefined),
    switchMap(() =>
      timer(0, 3000).pipe(
        switchMap(() => this.api.get(this.id)),
        takeWhile((video) => video.status === 'queued' || video.status === 'processing', true),
      ),
    ),
    tap((video) => {
      if (video.width && video.height && video.playbackUrl) {
        this.scheduleFit(video.width / video.height);
      }
    }),
  );

  constructor() {
    fromEvent(window, 'resize')
      .pipe(debounceTime(150), takeUntilDestroyed())
      .subscribe(() => {
        if (this.ratio == null) {
          return;
        }
        const viewportW = document.documentElement.clientWidth;
        const viewportH = document.documentElement.clientHeight;
        if (Math.abs(viewportW - this.viewportW) < 32 && Math.abs(viewportH - this.viewportH) < 32) {
          return;
        }
        this.fit(this.ratio);
      });
  }

  onMeta(event: Event): void {
    const media = event.target as HTMLVideoElement;
    if (media.videoWidth && media.videoHeight) {
      this.scheduleFit(media.videoWidth / media.videoHeight);
    }
    void media.play().catch(() => undefined);
  }

  private scheduleFit(ratio: number): void {
    this.ratio = ratio;
    requestAnimationFrame(() => this.fit(ratio));
  }

  private fit(ratio: number): void {
    const surface = this.host.nativeElement.closest('.mat-mdc-dialog-container');
    const content = this.host.nativeElement.querySelector('.mat-mdc-dialog-content');
    const title = this.host.nativeElement.querySelector('.head');
    const facts = this.host.nativeElement.querySelector('.facts');
    if (!(surface instanceof HTMLElement) || !(content instanceof HTMLElement) || !(title instanceof HTMLElement)) {
      return;
    }
    const contentStyle = getComputedStyle(content);
    const surfaceStyle = getComputedStyle(surface);
    const titleStyle = getComputedStyle(title);
    const factsStyle = facts instanceof HTMLElement ? getComputedStyle(facts) : null;
    const chromeX =
      parseFloat(contentStyle.paddingLeft) +
      parseFloat(contentStyle.paddingRight) +
      parseFloat(surfaceStyle.paddingLeft) +
      parseFloat(surfaceStyle.paddingRight) +
      parseFloat(surfaceStyle.borderLeftWidth) +
      parseFloat(surfaceStyle.borderRightWidth);
    const chromeY =
      title.getBoundingClientRect().height +
      parseFloat(titleStyle.marginTop) +
      parseFloat(titleStyle.marginBottom) +
      parseFloat(contentStyle.paddingTop) +
      parseFloat(contentStyle.paddingBottom) +
      parseFloat(surfaceStyle.paddingTop) +
      parseFloat(surfaceStyle.paddingBottom) +
      parseFloat(surfaceStyle.borderTopWidth) +
      parseFloat(surfaceStyle.borderBottomWidth) +
      (facts?.getBoundingClientRect().height ?? 0) +
      (factsStyle ? parseFloat(factsStyle.marginTop) + parseFloat(factsStyle.marginBottom) : 0);
    const viewportW = document.documentElement.clientWidth;
    const viewportH = document.documentElement.clientHeight;
    const maxW = Math.min(960, viewportW - 16);
    const maxH = viewportH - 16;
    const maxVideoW = Math.max(160, maxW - chromeX);
    const maxVideoH = Math.max(160, maxH - chromeY);
    let videoW = maxVideoW;
    let videoH = videoW / ratio;
    if (videoH > maxVideoH) {
      videoH = maxVideoH;
      videoW = videoH * ratio;
    }
    const width = Math.floor(videoW + chromeX);
    const height = Math.floor(videoH);
    const media = this.host.nativeElement.querySelector('video');
    const sized = media instanceof HTMLVideoElement && media.style.height === `${height}px`;
    if (width === this.appliedWidth && sized) {
      return;
    }
    this.appliedWidth = width;
    this.viewportW = viewportW;
    this.viewportH = viewportH;
    this.dialogRef.updateSize(`${width}px`);
    if (media instanceof HTMLVideoElement) {
      media.style.width = '100%';
      media.style.height = `${height}px`;
    }
    requestAnimationFrame(() => this.trimOverflow());
  }

  private trimOverflow(): void {
    const content = this.host.nativeElement.querySelector('.mat-mdc-dialog-content');
    const media = this.host.nativeElement.querySelector('video');
    if (!(content instanceof HTMLElement) || !(media instanceof HTMLVideoElement) || this.ratio == null) {
      return;
    }
    const extra = content.scrollHeight - content.clientHeight;
    if (extra <= 0) {
      return;
    }
    const nextHeight = Math.max(120, Math.floor(media.getBoundingClientRect().height - extra));
    const nextWidth = Math.floor(nextHeight * this.ratio);
    const chromeX = this.appliedWidth - Math.floor(media.getBoundingClientRect().width);
    const width = Math.max(160, nextWidth + Math.max(0, chromeX));
    media.style.height = `${nextHeight}px`;
    if (width !== this.appliedWidth) {
      this.appliedWidth = width;
      this.dialogRef.updateSize(`${width}px`);
    }
  }

  retry(id: string): void {
    this.facade
      .retry(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.reload$.next());
  }
}
