import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormArray, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TranslocoPipe } from '@jsverse/transloco';
import { LibraryFacade } from './library.facade';
import { UploadOptions, VideoQuality } from './video.models';

export interface UploadDialogData {
  files: File[];
}

@Component({
  selector: 'app-upload-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    TranslocoPipe,
  ],
  templateUrl: './upload-dialog.component.html',
  styleUrl: './upload-dialog.component.scss',
})
export class UploadDialog {
  private readonly dialogRef = inject(MatDialogRef<UploadDialog>);
  private readonly facade = inject(LibraryFacade);
  private readonly destroyRef = inject(DestroyRef);
  private readonly files: File[];

  readonly qualities: VideoQuality[] = ['high', 'standard', 'economy'];
  readonly uploading = signal(false);
  readonly errorKey = signal<string | null>(null);
  readonly form = new FormGroup({
    items: new FormArray<FormGroup>([]),
  });

  constructor() {
    const data = inject<UploadDialogData>(MAT_DIALOG_DATA);
    this.files = [...data.files];
    for (const file of this.files) {
      this.items.push(this.itemGroup(file));
    }
  }

  qualityLabel(quality: VideoQuality): string {
    if (quality === 'high') {
      return 'library.qualityHigh';
    }
    if (quality === 'economy') {
      return 'library.qualityEconomy';
    }
    return 'library.qualityStandard';
  }

  get items(): FormArray<FormGroup> {
    return this.form.controls.items;
  }

  cancel(): void {
    if (!this.uploading()) {
      this.dialogRef.close();
    }
  }

  upload(): void {
    if (this.form.invalid || this.uploading() || this.files.length === 0) {
      this.form.markAllAsTouched();
      return;
    }
    this.uploading.set(true);
    this.errorKey.set(null);
    this.dialogRef.disableClose = true;
    this.sendNext();
  }

  private sendNext(): void {
    const file = this.files[0];
    if (!file) {
      this.dialogRef.close();
      return;
    }
    this.facade
      .upload(file, this.optionsAt(0))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.files.shift();
          this.items.removeAt(0);
          this.sendNext();
        },
        error: () => {
          this.errorKey.set('library.uploadError');
          this.uploading.set(false);
          this.dialogRef.disableClose = false;
        },
      });
  }

  private itemGroup(file: File): FormGroup {
    return new FormGroup({
      title: new FormControl(nameFromFile(file), {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(200), nonBlank],
      }),
      quality: new FormControl<VideoQuality>('standard', { nonNullable: true }),
      rotate: new FormControl(false, { nonNullable: true }),
      mute: new FormControl(false, { nonNullable: true }),
      thumbnailOffset: new FormControl(0, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(0), Validators.max(86400)],
      }),
    });
  }

  private optionsAt(index: number): UploadOptions {
    const value = this.items.at(index).getRawValue() as UploadOptions;
    return {
      title: value.title.trim(),
      quality: value.quality,
      rotate: value.rotate,
      mute: value.mute,
      thumbnailOffset: Math.round(Number(value.thumbnailOffset) || 0),
    };
  }
}

function nonBlank(control: AbstractControl): ValidationErrors | null {
  return String(control.value ?? '').trim() ? null : { required: true };
}

function nameFromFile(file: File): string {
  const base = file.name.replace(/\.[^.]+$/, '').trim();
  return (base || file.name).slice(0, 200);
}
