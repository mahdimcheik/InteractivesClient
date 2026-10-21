import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '../services/store';
/**
 * @obsolete Pour le developpement uniquement
 * Intercepteur qui ajoute le token d'authentification aux requêtes API.
 * @param req La requête HTTP
 * @param next La fonction pour passer à la prochaine étape
 * @returns La réponse de la requête
 */
export const TokenInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(Store);
  const token = store.token();

  // Don't add token to non-API requests or if no token exists
  if (!token) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(authReq);
};
