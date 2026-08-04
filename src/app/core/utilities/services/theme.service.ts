import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';

import { StorageService } from './storage.service';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

/** Doit rester aligné avec `darkModeSelector` dans `app.config.ts` et le script inline de `index.html`. */
const DARK_CLASS = 'app-dark';

/**
 * Thème clair / sombre. La classe est déjà posée sur `<html>` par le script inline
 * de `index.html` avant le premier rendu : ce service se contente de reprendre
 * cet état puis de le piloter. Sur le serveur il ne touche ni au DOM ni au stockage.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly document = inject(DOCUMENT);
  private readonly storage = inject(StorageService);

  private readonly _preference = signal<ThemePreference>(this.readStoredPreference());
  private readonly _systemPrefersDark = signal(false);

  /** Choix de l'utilisateur, `'system'` inclus. */
  readonly preference = this._preference.asReadonly();

  /** Thème réellement appliqué, `'system'` résolu. */
  readonly theme = computed<ResolvedTheme>(() => {
    const preference = this._preference();
    if (preference !== 'system') {
      return preference;
    }
    return this._systemPrefersDark() ? 'dark' : 'light';
  });

  readonly isDark = computed(() => this.theme() === 'dark');

  constructor() {
    // `matchMedia` est absent de jsdom (tests unitaires) : on retombe alors sur le thème clair.
    if (this.isBrowser && typeof window.matchMedia === 'function') {
      const query = window.matchMedia('(prefers-color-scheme: dark)');
      this._systemPrefersDark.set(query.matches);
      query.addEventListener('change', (event) => this._systemPrefersDark.set(event.matches));
    }

    effect(() => {
      const isDark = this.isDark();
      if (!this.isBrowser) {
        return;
      }
      this.document.documentElement.classList.toggle(DARK_CLASS, isDark);
    });
  }

  setPreference(preference: ThemePreference): void {
    this._preference.set(preference);
    this.storage.set(STORAGE_KEY, preference);
  }

  /** Bascule explicite clair <-> sombre : sort du mode `'system'`. */
  toggle(): void {
    this.setPreference(this.isDark() ? 'light' : 'dark');
  }

  private readStoredPreference(): ThemePreference {
    const stored = this.storage.get(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
  }
}
