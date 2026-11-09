import { Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { VideoStatus } from '../../features/library/video.models';

@Component({
  selector: 'app-status-chip',
  imports: [TranslocoPipe],
  template: `<span [class]="'chip ' + status()">{{ 'status.' + status() | transloco }}</span>`,
  styleUrl: './status-chip.component.scss',
})
export class StatusChip {
  readonly status = input.required<VideoStatus>();
}
