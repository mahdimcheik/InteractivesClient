import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonModule } from '@syncfusion/ej2-angular-buttons';
import { filter } from 'rxjs';

import { Store } from '@core/utilities/services/store';

import { ThemeToggle } from '../theme-toggle/theme-toggle';

interface NavLink {
  readonly path: string;
  readonly label: string;
}

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ButtonModule, ThemeToggle],
  templateUrl: './public-layout.html',
  styleUrl: './public-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicLayout {
  private readonly store = inject(Store);
  private readonly router = inject(Router);

  protected readonly isAuthenticated = this.store.isAuthenticated;
  protected readonly menuOpen = signal(false);
  protected readonly isMobile = signal(false);
  protected readonly shouldShowMenu = computed(() => !this.isMobile() || this.menuOpen());
  protected readonly currentYear = new Date().getFullYear();

  protected readonly links: readonly NavLink[] = [
    { path: '/', label: 'Accueil' },
    { path: '/a-propos', label: 'À propos' },
    { path: '/contact', label: 'Contact' },
  ];

  constructor() {
    if (typeof window !== 'undefined') {
      const updateViewport = () => this.isMobile.set(window.innerWidth < 768);
      updateViewport();
      window.addEventListener('resize', updateViewport);
    }

    // Sans ça, le menu mobile resterait ouvert par-dessus la page d'arrivée.
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.menuOpen.set(false));
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }
}
