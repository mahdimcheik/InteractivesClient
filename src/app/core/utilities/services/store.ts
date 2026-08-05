import { Injectable, computed, signal } from '@angular/core';
import { LoginResponse, UserDetails } from '@client';

@Injectable({
  providedIn: 'root',
})
export class Store {
  user = signal<UserDetails | undefined>(undefined);
  token = signal<string | null>(null);
  refreshToken = signal<string | null>(null);

  /** Source de vérité des guards et des layouts. */
  readonly isAuthenticated = computed(() => this.user() !== undefined);

  persistData(data: LoginResponse | undefined): void {
    this.user.set(data?.user);
    this.token.set(data?.token ?? null);
    this.refreshToken.set(data?.refreshToken ?? null);

    localStorage.setItem('user', JSON.stringify(data?.user));
    localStorage.setItem('token', data?.token ?? '');
    localStorage.setItem('refreshToken', data?.refreshToken ?? '');
  }

  clearData() {
    this.user.set(undefined);
    this.token.set(null);
    this.refreshToken.set(null);

    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }
}
