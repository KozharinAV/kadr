import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslocoPipe } from '@jsverse/transloco';
import { UserProfile } from '../../core/auth/auth.models';
import { fieldErrorKey } from '../../shared/ui/field-error';
import { AdminUsersFacade } from './admin-users.facade';
import { userErrorKey } from './user-error';
import { UserRole } from './users.api';

export interface UserFormData {
  user: UserProfile | null;
}

@Component({
  selector: 'app-user-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TranslocoPipe,
  ],
  templateUrl: './user-form-dialog.component.html',
  styleUrl: './user-form-dialog.component.scss',
})
export class UserFormDialog {
  readonly data = inject<UserFormData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<UserFormDialog, UserProfile | undefined>);
  private readonly facade = inject(AdminUsersFacade);
  private readonly destroyRef = inject(DestroyRef);

  readonly roles: UserRole[] = ['admin', 'editor', 'viewer'];
  readonly errorKey = fieldErrorKey;
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);
  readonly form = new FormGroup({
    email: new FormControl(this.data.user?.email ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: this.data.user ? [Validators.minLength(8)] : [Validators.required, Validators.minLength(8)],
    }),
    role: new FormControl<UserRole>(this.data.user?.role ?? 'viewer', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  cancel(): void {
    this.dialogRef.close();
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, password, role } = this.form.getRawValue();
    const draft = password ? { email, password, role } : { email, role };
    const current = this.data.user;
    this.saving.set(true);
    this.formError.set(null);
    const request = current ? this.facade.update(current.id, draft) : this.facade.create(draft);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (user) => this.dialogRef.close(user),
      error: (error: unknown) => {
        this.formError.set(userErrorKey(error));
        this.saving.set(false);
      },
    });
  }
}
