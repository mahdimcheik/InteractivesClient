import { HttpInterceptorFn } from '@angular/common/http';
import { exceptionList } from './exception-url';

/**
 * Intercepteur qui gère les exceptions en désactivant le loader pour certaines requêtes.
 * Les URLs à exclure sont définies dans exceptionList.
 * @param req La requête HTTP
 * @param next La fonction pour passer à la prochaine étape
 * @returns La réponse de la requête
 */
export const exceptionLoaderInterceptor: HttpInterceptorFn = (req, next) => {
    if (exceptionList.some((url) => req.url.includes(url))) {
        req = req.clone({
            setHeaders: { 'X-Show-Loader': 'false' }
        });
    }
    return next(req);
};
