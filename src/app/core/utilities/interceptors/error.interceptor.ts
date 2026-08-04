import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NotificationService } from '@core/utilities/services/notification.service';
import { catchError, throwError } from 'rxjs';

/**
 * Statuts sans toast :
 * - 401 est géré par `authInterceptor` (refresh puis rejeu) ;
 * - 409 et 422 sont des erreurs de formulaire, affichées à côté du champ concerné.
 */
const SILENT_STATUSES = [401, 409, 422];

const messageFor = (error: HttpErrorResponse): string => {
  if (error.status === 0) {
    return 'Serveur injoignable. Vérifiez votre connexion.';
  }
  const body = error.error as { message?: string } | null;
  if (body?.message) {
    return body.message;
  }
  if (error.status === 403) {
    return "Vous n'avez pas les droits nécessaires.";
  }
  if (error.status === 404) {
    return 'Ressource introuvable.';
  }
  if (error.status >= 500) {
    return 'Une erreur serveur est survenue. Réessayez plus tard.';
  }
  return 'Une erreur est survenue.';
};

/** Transforme les erreurs HTTP en toast lisible, sans avaler l'erreur. */
export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const messages = inject(NotificationService);
  const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  return next(request).pipe(
    catchError((error: unknown) => {
      if (
        isBrowser &&
        error instanceof HttpErrorResponse &&
        !SILENT_STATUSES.includes(error.status)
      ) {
        messages.add({
          severity: 'error',
          summary: 'Erreur',
          detail: messageFor(error),
          life: 5000,
        });
      }
      return throwError(() => error);
    }),
  );
};
