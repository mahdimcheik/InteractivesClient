import { Injectable, computed, inject } from '@angular/core';
import { catchError, finalize, map, Observable, of, shareReplay, tap, throwError } from 'rxjs';

import {
  AuthService as GeneratedAuthService,
  ForgotPasswordRequest,
  GoogleAuthRequest,
  LoginRequest,
  LoginResponseResponse,
  ObjectResponse,
  RegisterRequest,
  ResetPasswordRequest,
  UserDetailsResponse,
  LoginResponse,
} from '@client';

import { Store } from './store';

/**
 * Miroir de `AuthService` (client généré `src/client`) : noms lisibles et écriture
 * de la session dans le {@link Store}, seule source de vérité pour les guards,
 * l'intercepteur et les layouts.
 */
@Injectable({ providedIn: 'root' })
export class AuthMirrorService {
  private readonly api = inject(GeneratedAuthService);
  private readonly store = inject(Store);

  /** Refresh partagé : toutes les requêtes tombées en 401 attendent le même appel. */
  private refreshInFlight: Observable<string> | null = null;

  user = this.store.user;
  token = this.store.token;
  refreshToken = this.store.refreshToken;
  isAuthenticated = this.store.isAuthenticated;

  readonly fullName = computed(() => {
    const user = this.store.user();
    return user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : '';
  });

  register(payload: RegisterRequest): Observable<UserDetailsResponse> {
    return this.api.authRegisterPost(payload);
  }

  login(payload: LoginRequest): Observable<LoginResponse | undefined> {
    return this.api.authLoginPost(payload).pipe(
      map((res) => res.data),
      tap((loginResponse) => this.store.persistData(loginResponse)),
    );
  }

  loginWithGoogle(payload: GoogleAuthRequest): Observable<LoginResponse | undefined> {
    return this.api.authGooglePost(payload).pipe(
      map((res) => res.data),
      tap((loginResponse) => this.store.persistData(loginResponse)),
    );
  }

  confirmEmail(userId: string, token: string): Observable<unknown> {
    return this.api.authEmailConfirmationGet(userId, token);
  }

  refreshTokenCall(): Observable<LoginResponseResponse> {
    return this.api.authRefreshTokenGet();
  }

  /**
   * Restaure la session au démarrage à partir du `refreshToken` persisté, sans jamais
   * faire échouer l'app initializer (un refresh silencieux raté équivaut juste à
   * une session absente).
   */
  restoreSession(): Observable<string | null> {
    if (!this.store.hasPersistedSession()) {
      return of(null);
    }

    return this.refreshSession().pipe(catchError(() => of(null)));
  }

  /**
   * Rejoue le refresh en cours s'il y en a un, sinon en démarre un et met la
   * session à jour. Utilisé par `authInterceptor` sur 401.
   */
  refreshSession(): Observable<string> {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }

    this.refreshInFlight = this.refreshTokenCall().pipe(
      map((res) => res.data),
      tap((loginResponse) => this.store.persistData(loginResponse)),
      map((loginResponse) => {
        const token = loginResponse?.token;
        if (!token) {
          throw new Error('Refresh sans token.');
        }
        return token;
      }),
      catchError((error: unknown) => {
        this.clearSession();
        return throwError(() => error);
      }),
      finalize(() => {
        this.refreshInFlight = null;
      }),
      shareReplay(1),
    );

    return this.refreshInFlight;
  }

  forgotPassword(payload: ForgotPasswordRequest): Observable<ObjectResponse> {
    return this.api.authForgotPasswordPost(payload);
  }

  resetPassword(payload: ResetPasswordRequest): Observable<ObjectResponse> {
    return this.api.authResetPasswordPost(payload);
  }

  logout(): Observable<ObjectResponse> {
    // Révocation côté serveur ; l'état local part dans tous les cas via `clearSession()`.
    return this.api.authLogoutGet().pipe(tap(() => this.clearSession()));
  }

  /** Vide la session locale sans appeler l'API (refresh échoué, logout en erreur). */
  clearSession(): void {
    this.store.clearData();
  }
}
