import { isPlatformServer } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Store } from '../services/store';

/**
 * Sur le serveur il n'y a pas de session : on laisse passer et c'est le rendu
 * client (`RenderMode.Client` dans `app.routes.server.ts`) qui tranche.
 * Sans ça, le prerender redirigerait tout le monde vers /connexion.
 */
const isServer = (): boolean => isPlatformServer(inject(PLATFORM_ID));

/** Réserve la route aux utilisateurs connectés. */
export const authGuard: CanActivateFn = (_route, state) => {
  if (isServer()) {
    return true;
  }

  if (inject(Store).isAuthenticated()) {
    return true;
  }

  return inject(Router).createUrlTree(['/connexion'], {
    queryParams: { returnUrl: state.url },
  });
};

/** Réserve la route aux visiteurs anonymes (connexion, inscription). */
export const guestGuard: CanActivateFn = () => {
  if (isServer()) {
    return true;
  }

  return inject(Store).isAuthenticated() ? inject(Router).createUrlTree(['/dashboard']) : true;
};
