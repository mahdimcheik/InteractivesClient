import { Injectable, computed, inject, signal } from '@angular/core';
import { LoginResponse, UserDetails } from '@client';

import { StorageService } from './storage.service';

const AUTH_USER_KEY = 'user';
const AUTH_TOKEN_KEY = 'token';
const AUTH_REFRESH_TOKEN_KEY = 'refreshToken';

@Injectable({
  providedIn: 'root',
})
export class Store {
  private readonly storage = inject(StorageService);

  user = signal<UserDetails | undefined>(undefined);
  token = signal<string | null>(null);
  refreshToken = signal<string | null>(null);

  /** Source de vérité des guards et des layouts. */
  readonly isAuthenticated = computed(() => this.user() !== undefined);
  readonly isAdmin = computed(
    () => this.user()?.roles?.some((role) => role.name?.toLocaleLowerCase() === 'admin') ?? false,
  );
  readonly isProfessionnal = computed(
    () =>
      this.user()?.roles?.some((role) => role.name?.toLocaleLowerCase() === 'professionnel') ??
      false,
  );
  readonly isClient = computed(
    () => this.user()?.roles?.some((role) => role.name?.toLocaleLowerCase() === 'client') ?? false,
  );

  persistData(data: LoginResponse | undefined): void {
    this.user.set(data?.user);
    this.token.set(data?.token ?? null);
    this.refreshToken.set(data?.refreshToken ?? null);

    data?.user
      ? this.storage.set(AUTH_USER_KEY, JSON.stringify(data.user))
      : this.storage.remove(AUTH_USER_KEY);
    data?.token
      ? this.storage.set(AUTH_TOKEN_KEY, data.token)
      : this.storage.remove(AUTH_TOKEN_KEY);
    data?.refreshToken
      ? this.storage.set(AUTH_REFRESH_TOKEN_KEY, data.refreshToken)
      : this.storage.remove(AUTH_REFRESH_TOKEN_KEY);
  }

  clearData() {
    this.user.set(undefined);
    this.token.set(null);
    this.refreshToken.set(null);

    this.storage.remove(AUTH_USER_KEY);
    this.storage.remove(AUTH_TOKEN_KEY);
    this.storage.remove(AUTH_REFRESH_TOKEN_KEY);
  }

  /** Utilisé au boot pour savoir s'il vaut la peine de tenter un refresh silencieux. */
  hasPersistedSession(): boolean {
    if (this.user() !== undefined) {
      return true;
    }
    const token = this.storage.get(AUTH_TOKEN_KEY);
    return token !== null && token !== '' && token !== undefined;
  }
}
