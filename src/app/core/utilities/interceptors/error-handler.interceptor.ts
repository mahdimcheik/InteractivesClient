import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, finalize, switchMap, throwError } from 'rxjs';
import { environment } from '@env/environment';

import { AuthMirrorService } from '../services';
import { Store } from '../services/store';

/**
 * Interceptor qui gère les erreurs 401 (Unauthorized) en tentant de rafraîchir le token.
 * Si le rafraîchissement échoue, l'utilisateur est déconnecté.
 */

let isRefreshing = false;

export const errorHandlerInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthMirrorService);
  const store = inject(Store);

  // Hors API, un 401 ne concerne pas notre session : rejouer la requête y enverrait le jeton.
  if (req.url.includes('/refresh-token') || !req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !isRefreshing) {
        isRefreshing = true;

        return authService.refreshSession().pipe(
          catchError((refreshErr) => {
            isRefreshing = false;
            store.clearData();
            return throwError(() => refreshErr);
          }),
          switchMap(() => {
            const clonedRequest = req.clone({
              setHeaders: {
                Authorization: `Bearer ${authService.token()}`,
              },
            });
            return next(clonedRequest);
          }),
          finalize(() => {
            isRefreshing = false;
          }),
        );
      }

      return throwError(() => err);
    }),
  );
};
