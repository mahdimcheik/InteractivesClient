import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

import { AuthMirrorService } from '../services/auth-mirror.service';
import { Store } from '../services/store';

/**
 * Endpoints publics : ni Bearer, ni refresh (sinon un 401 sur `/Auth/login`
 * déclencherait un refresh qui échouerait à son tour, en boucle).
 * Chemins du client généré (`src/client`) — à mettre à jour si l'API les renomme.
 */
const PUBLIC_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/google',
  '/auth/refresh-token',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/email-confirmation',
];

/** `/Auth/logout` porte le Bearer mais ne doit jamais relancer un refresh. */
const NO_REFRESH_ENDPOINTS = [...PUBLIC_ENDPOINTS, '/auth/logout'];

const matches = (url: string, endpoints: readonly string[]): boolean =>
  endpoints.some((endpoint) => url.includes(endpoint));

const withBearer = (request: HttpRequest<unknown>, token: string): HttpRequest<unknown> =>
  request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

/**
 * Ajoute le Bearer lu dans le {@link Store} et, sur 401, tente un refresh unique
 * (partagé par toutes les requêtes en échec via `AuthMirrorService.refreshSession()`)
 * avant de rejouer la requête.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const store = inject(Store);
  const auth = inject(AuthMirrorService);
  const router = inject(Router);

  const url = request.url.toLowerCase();
  const isPublic = matches(url, PUBLIC_ENDPOINTS);
  const token = store.token();

  const outgoing = !isPublic && token ? withBearer(request, token) : request;

  return next(outgoing).pipe(
    catchError((error: unknown) => {
      const hadSession = store.token() !== null || store.refreshToken() !== null;
      const isExpiredSession =
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        hadSession &&
        !matches(url, NO_REFRESH_ENDPOINTS);

      if (!isExpiredSession) {
        return throwError(() => error);
      }

      return auth.refreshSession().pipe(
        switchMap((freshToken) => next(withBearer(request, freshToken))),
        catchError((refreshError: unknown) => {
          auth.clearSession();
          void router.navigate(['/connexion'], { queryParams: { returnUrl: router.url } });
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
