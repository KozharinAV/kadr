import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoPipe } from '@jsverse/transloco';
import { UserProfile } from '../../core/auth/auth.models';

@Component({
  selector: 'app-user-card-dialog',
  imports: [MatDialogModule, MatButtonModule, MatTooltipModule, TranslocoPipe],
  templateUrl: './user-card-dialog.component.html',
  styleUrl: './user-card-dialog.component.scss',
})
export class UserCardDialog {
  readonly user = inject<UserProfile>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<UserCardDialog, 'edit' | undefined>);

  edit(): void {
    this.dialogRef.close('edit');
  }
}
