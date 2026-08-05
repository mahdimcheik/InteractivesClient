import { Routes } from '@angular/router';

import { authGuard, guestGuard } from '@core/utilities/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/public-layout/public-layout').then((m) => m.PublicLayout),
    children: [
      {
        path: '',
        title: 'Accueil',
        loadComponent: () => import('./features/home/home').then((m) => m.Home),
      },
      {
        path: 'a-propos',
        title: 'À propos',
        loadComponent: () => import('./features/about/about').then((m) => m.About),
      },
      {
        path: 'contact',
        title: 'Contact',
        loadComponent: () => import('./features/contact/contact').then((m) => m.Contact),
      },
    ],
  },
  {
    path: '',
    loadComponent: () => import('./layout/auth-shell/auth-shell').then((m) => m.AuthShell),
    children: [
      {
        path: 'connexion',
        title: 'Connexion',
        canActivate: [guestGuard],
        loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
      },
      {
        path: 'inscription',
        title: 'Inscription',
        canActivate: [guestGuard],
        loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
      },
      {
        path: 'mot-de-passe-oublie',
        title: 'Mot de passe oublié',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/forgot-password/forgot-password').then((m) => m.ForgotPassword),
      },
      {
        path: 'reinitialiser-mot-de-passe',
        title: 'Réinitialiser le mot de passe',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/reset-password/reset-password').then((m) => m.ResetPassword),
      },
      {
        path: 'confirmation-compte',
        title: 'Confirmation du compte',
        loadComponent: () =>
          import('./features/auth/account-confirmed/account-confirmed').then(
            (m) => m.AccountConfirmed,
          ),
      },
    ],
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
  },

  {
    path: '**',
    title: 'Page introuvable',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
  },
];
