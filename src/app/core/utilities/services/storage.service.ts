import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '@env/environment';
import { LoginResponse, UserDetails } from '@client';

/**
 * Accès à `localStorage` sûr en SSR : sur le serveur toutes les méthodes sont
 * des no-op. C'est le seul endroit qui doit tester la plateforme pour le stockage.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly prefix = environment.storagePrefix;

  get(key: string): string | null {
    if (!this.isBrowser) {
      return null;
    }
    try {
      return localStorage.getItem(this.prefix + key);
    } catch {
      // Mode privé / stockage désactivé : on dégrade silencieusement.
      return null;
    }
  }

  set(key: string, value: string): void {
    if (!this.isBrowser) {
      return;
    }
    try {
      localStorage.setItem(this.prefix + key, value);
    } catch {
      /* quota dépassé ou stockage désactivé */
    }
  }

  remove(key: string): void {
    if (!this.isBrowser) {
      return;
    }
    try {
      localStorage.removeItem(this.prefix + key);
    } catch {
      /* stockage désactivé */
    }
  }
}
