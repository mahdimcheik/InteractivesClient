import { Observable } from 'rxjs';

import { AuthResponse, AuthTokens, LoginRequest, RegisterRequest, User } from './auth.models';

/**
 * Contrat entre `AuthService` et le backend. Deux implémentations existent :
 * `HttpAuthApi` (vraie API) et `MockAuthApi` (en mémoire). Le choix se fait
 * dans `app.config.ts` via `environment.useMockAuth`.
 *
 * Classe abstraite plutôt qu'interface : sert aussi de jeton d'injection.
 */
export abstract class AuthApi {
  abstract login(payload: LoginRequest): Observable<AuthResponse>;
  abstract register(payload: RegisterRequest): Observable<AuthResponse>;
  abstract refresh(refreshToken: string): Observable<AuthTokens>;
  abstract me(): Observable<User>;
  abstract logout(refreshToken: string): Observable<void>;
}
