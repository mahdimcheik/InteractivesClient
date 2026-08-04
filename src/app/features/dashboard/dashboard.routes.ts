import { Routes } from '@angular/router';

import { DashboardLayout } from '../../layout/dashboard-layout/dashboard-layout';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    component: DashboardLayout,
    children: [
      {
        path: '',
        title: "Vue d'ensemble",
        loadComponent: () => import('./overview/overview').then((m) => m.Overview),
      },
      {
        path: 'profil',
        title: 'Profil',
        loadComponent: () => import('./profile/profile').then((m) => m.Profile),
      },
      {
        path: 'parametres',
        title: 'Paramètres',
        loadComponent: () => import('./settings/settings').then((m) => m.Settings),
      },
    ],
  },
];
