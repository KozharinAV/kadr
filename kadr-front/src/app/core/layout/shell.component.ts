import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { filter, map, startWith, switchMap } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { HasPermission } from '../../shared/directives/has-permission.directive';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog';
import { LanguageSelect } from '../../shared/ui/language-select.component';

@Component({
  selector: 'app-shell',
  imports: [
    AsyncPipe,
    MatToolbarModule,
    MatButtonModule,
    RouterLink,
    RouterOutlet,
    TranslocoPipe,
    HasPermission,
    LanguageSelect,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class Shell {
  private readonly auth = inject(AuthService);
  private readonly confirm = inject(ConfirmDialog);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly user$ = this.auth.user$;
  private readonly path = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );
  readonly libraryActive = computed(() => {
    const path = this.path().split(/[?#]/)[0];
    return path.startsWith('/library') || path.startsWith('/videos');
  });
  readonly usersActive = computed(() => this.path().split(/[?#]/)[0].startsWith('/admin/users'));

  logout(): void {
    this.confirm
      .open('auth.logoutTitle', 'auth.logoutMessage')
      .pipe(
        filter((confirmed) => confirmed),
        switchMap(() => this.auth.logout()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        void this.router.navigateByUrl('/login');
      });
  }
}
