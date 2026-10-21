import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoaderService } from '../services/loader.service';

/**
 * Intercepteur qui gère l'affichage du loader pour les requêtes HTTP.
 * les fonction show et hide du service LoaderService sont appelées au début et à la fin de chaque requête.
 * elles incrementent et décrémentent un compteur interne pour gérer les requêtes simultanées.
 * @param req La requête HTTP
 * @param next La fonction pour passer à la prochaine étape
 * @returns La réponse de la requête
 */
export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  const loaderService = inject(LoaderService);

  const dontShowLoader = req.headers.get('X-Show-Loader') === 'false';

  if (dontShowLoader) {
    return next(req);
  }

  loaderService.show();
  return next(req).pipe(finalize(() => loaderService.hide()));
};
