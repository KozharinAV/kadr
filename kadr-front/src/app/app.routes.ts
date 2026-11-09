import { Routes } from '@angular/router';
import { authGuard, guestGuard, permissionGuard } from './core/auth/auth.guard';
import { Shell } from './core/layout/shell.component';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login-page.component').then((m) => m.LoginPage),
  },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'library' },
      {
        path: 'library',
        loadComponent: () =>
          import('./features/library/library-page.component').then((m) => m.LibraryPage),
      },
      {
        path: 'videos/:id',
        loadComponent: () => import('./features/video/video-page.component').then((m) => m.VideoLink),
      },
      {
        path: 'admin/users',
        canActivate: [permissionGuard('user.manage')],
        loadComponent: () =>
          import('./features/admin/users-page.component').then((m) => m.UsersPage),
      },
    ],
  },
  { path: '**', redirectTo: 'library' },
];
