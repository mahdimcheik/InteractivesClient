import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonModule } from '@syncfusion/ej2-angular-buttons';
import { filter } from 'rxjs';

import { AuthMirrorService } from '@core/utilities/services/auth-mirror.service';

import { ThemeToggle } from '../theme-toggle/theme-toggle';

interface SidebarLink {
  readonly path: string;
  readonly label: string;
  readonly icon: string;
  readonly exact: boolean;
}

@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ButtonModule, ThemeToggle],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardLayout {
  private readonly auth = inject(AuthMirrorService);
  private readonly router = inject(Router);

  protected readonly fullName = this.auth.fullName;
  protected readonly sidebarOpen = signal(false);
  protected readonly isMobile = signal(false);
  protected readonly shouldShowSidebar = computed(() => !this.isMobile() || this.sidebarOpen());

  protected readonly links: readonly SidebarLink[] = [
    { path: '/dashboard', label: "Vue d'ensemble", icon: 'pi-home', exact: true },
    { path: '/dashboard/profil', label: 'Profil', icon: 'pi-user', exact: false },
    { path: '/dashboard/parametres', label: 'Paramètres', icon: 'pi-cog', exact: false },
  ];

  constructor() {
    if (typeof window !== 'undefined') {
      const updateViewport = () => this.isMobile.set(window.innerWidth < 768);
      updateViewport();
      window.addEventListener('resize', updateViewport);
    }

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.sidebarOpen.set(false));
  }

  protected toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  protected logout(): void {
    // Révocation best-effort : la session locale est vidée quoi qu'il arrive.
    this.auth.logout().subscribe({
      next: () => void this.router.navigateByUrl('/'),
      error: () => {
        this.auth.clearSession();
        void this.router.navigateByUrl('/');
      },
    });
  }
}
