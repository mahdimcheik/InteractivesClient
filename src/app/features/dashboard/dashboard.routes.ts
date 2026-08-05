import { Routes } from '@angular/router';

import { DashboardLayout } from '../../layout/dashboard-layout/dashboard-layout';
import { authGuard } from '@app/core/utilities/guards/auth.guard';

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
      {
        path: 'editeur/:presentationId',
        title: 'Éditeur',
        loadComponent: () =>
          import('../../features/presentation-editor/presentation-editor').then(
            (m) => m.PresentationEditor,
          ),
      },
      {
        path: 'presentations',
        title: 'Présentations',
        loadComponent: () =>
          import('../../features/presentation-editor/my-presentations/my-presentations').then(
            (m) => m.MyPresentations,
          ),
      },
      // teacher routes
      // {
      //   path: 'cours',
      //   title: 'Cours',
      //   // loadComponent: () => import('./courses/courses').then((m) => m.Courses),
      // },
      // {
      //   path: 'cours/:courseId',
      //   title: 'Cours',
      //   // loadComponent: () => import('./course/course').then((m) => m.Course),
      // },
      // {
      //   path: 'cours/eidtion/:editionId',
      //   title: 'Édition de cours',
      //   // loadComponent: () => import('./edition/edition').then((m) => m.Edition),
      // },
    ],
  },
];
