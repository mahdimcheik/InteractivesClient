import { HttpEvent, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, finalize, Observable, switchMap, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthMirrorService } from '../services';
import { Store } from '../services/store';

/**
 * Interceptor qui gère les erreurs 401 (Unauthorized) en tentant de rafraîchir le token.
 * Si le rafraîchissement échoue, l'utilisateur est déconnecté.
 * Utilisation : dans app.module.ts, ajouter dans les providers :
 */

let isRefreshing = false;

export const errorHandlerInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthMirrorService);
  const store = inject(Store);

  if (req.url.includes('/refresh-token')) {
    return next(req);
  }

  return next(req).pipe(
    catchError((err: any) => {
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
  ) as Observable<HttpEvent<any>>;
};
