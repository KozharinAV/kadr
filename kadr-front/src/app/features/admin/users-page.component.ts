import { SelectionModel } from '@angular/cdk/collections';
import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { filter, finalize, switchMap, take } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { UserProfile } from '../../core/auth/auth.models';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog';
import { PageScaffold } from '../../shared/ui/page-scaffold.component';
import { AdminUsersFacade } from './admin-users.facade';
import { userErrorKey } from './user-error';
import { UserCardDialog } from './user-card-dialog.component';
import { UserFormData, UserFormDialog } from './user-form-dialog.component';

@Component({
  selector: 'app-users-page',
  imports: [
    AsyncPipe,
    MatButtonModule,
    MatCheckboxModule,
    MatTableModule,
    MatTooltipModule,
    TranslocoPipe,
    PageScaffold,
  ],
  templateUrl: './users-page.component.html',
  styleUrl: './users-page.component.scss',
})
export class UsersPage {
  private readonly facade = inject(AdminUsersFacade);
  private readonly auth = inject(AuthService);
  private readonly confirm = inject(ConfirmDialog);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly state$ = this.facade.state$;
  readonly columns = ['select', 'email', 'role', 'actions'];
  readonly selection = new SelectionModel<UserProfile>(true, []);
  readonly deleteError = signal<string | null>(null);
  private readonly currentUser = toSignal(this.auth.user$, { initialValue: null });

  isSelected(user: UserProfile): boolean {
    return this.selection.selected.some((item) => item.id === user.id);
  }

  isSelf(user: UserProfile): boolean {
    return this.currentUser()?.id === user.id;
  }

  includesSelf(): boolean {
    return this.selection.selected.some((user) => this.isSelf(user));
  }

  allSelected(users: UserProfile[]): boolean {
    return users.length > 0 && users.every((user) => this.isSelected(user));
  }

  someSelected(users: UserProfile[]): boolean {
    return users.some((user) => this.isSelected(user)) && !this.allSelected(users);
  }

  toggle(user: UserProfile): void {
    const current = this.selection.selected.find((item) => item.id === user.id);
    if (current) {
      this.selection.deselect(current);
      return;
    }
    this.selection.select(user);
  }

  toggleAll(users: UserProfile[]): void {
    if (this.allSelected(users)) {
      this.selection.clear();
      return;
    }
    this.selection.clear();
    this.selection.select(...users);
  }

  openCreate(): void {
    this.openForm(null);
  }

  openEdit(user: UserProfile | undefined): void {
    if (!user) {
      return;
    }
    this.openForm(user);
  }

  editSelected(): void {
    if (this.selection.selected.length !== 1) {
      return;
    }
    this.openEdit(this.selection.selected[0]);
  }

  openCard(user: UserProfile): void {
    this.dialog
      .open<UserCardDialog, UserProfile, 'edit' | undefined>(UserCardDialog, {
        data: user,
        width: '440px',
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((action) => {
        if (action === 'edit') {
          this.openEdit(user);
        }
      });
  }

  remove(users: UserProfile[]): void {
    if (users.length === 0 || users.some((user) => this.isSelf(user))) {
      return;
    }
    const messageKey = users.length === 1 ? 'admin.deleteMessage' : 'admin.deleteMany';
    const params: Record<string, string> =
      users.length === 1 ? { email: users[0].email } : { count: String(users.length) };
    this.confirm
      .open('admin.deleteTitle', messageKey, params)
      .pipe(
        filter((confirmed) => confirmed),
        switchMap(() => this.facade.removeMany(users.map((user) => user.id))),
        finalize(() => this.selection.clear()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.deleteError.set(null),
        error: (error: unknown) => this.deleteError.set(userErrorKey(error)),
      });
  }

  private openForm(user: UserProfile | null): void {
    const opener = document.activeElement;
    this.dialog
      .open<UserFormDialog, UserFormData, UserProfile | undefined>(UserFormDialog, {
        data: { user },
        width: '480px',
        disableClose: true,
        restoreFocus: false,
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((saved) => {
        if (opener instanceof HTMLElement) {
          opener.blur();
        }
        if (!saved) {
          return;
        }
        this.selection.clear();
        this.deleteError.set(null);
        this.auth.user$.pipe(take(1), takeUntilDestroyed(this.destroyRef)).subscribe((current) => {
          if (current?.id === saved.id) {
            this.refreshSelf(saved.id);
          }
        });
      });
  }

  private refreshSelf(id: string): void {
    this.auth
      .refreshProfile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((profile) => {
        if (profile.id === id && !profile.permissions.includes('user.manage')) {
          void this.router.navigateByUrl('/library');
        }
      });
  }
}
