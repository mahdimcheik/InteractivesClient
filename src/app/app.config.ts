import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  LOCALE_ID,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { provideDefaultClient } from '@client';
import { environment } from '@env/environment';

import { AuthMirrorService } from './core/utilities/services';
import { routes } from './app.routes';
import { TokenInterceptor } from './core/utilities/interceptors/token.interceptor';
import { cookiesInterceptor } from './core/utilities/interceptors/cookies.interceptor';
import { errorHandlerInterceptor } from './core/utilities/interceptors/error-handler.interceptor';
import { exceptionLoaderInterceptor } from './core/utilities/interceptors/exception-loader.interceptor';
import { loaderInterceptor } from './core/utilities/interceptors/loader.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'fr-FR' },
    // Client généré (ng-openapi) : `npm run gen-api` le régénère depuis le swagger.
    provideDefaultClient({ basePath: environment.apiUrl }),
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
    ),
    // withFetch() est requis en SSR (transfer state HTTP, pas de XHR côté serveur).
    provideHttpClient(
      withFetch(),
      withInterceptors([
        TokenInterceptor,
        cookiesInterceptor,
        errorHandlerInterceptor,
        exceptionLoaderInterceptor,
        loaderInterceptor,
      ]),
    ),
    provideClientHydration(withEventReplay()),
    // Restaure la session avant le premier rendu, pour que les guards voient l'état réel.
    provideAppInitializer(() => firstValueFrom(inject(AuthMirrorService).restoreSession())),
  ],
};
