import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '@env/environment';

import { Store } from '../services/store';

/**
 * Ajoute le jeton d'accès (`Authorization: Bearer …`) aux requêtes vers l'API, et à elles
 * seules : un appel vers un service tiers ne doit jamais emporter le jeton.
 */
export const TokenInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(Store).token();

  if (!token || !req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
