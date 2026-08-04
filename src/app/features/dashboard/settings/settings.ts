import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from '@syncfusion/ej2-angular-buttons';

import { AuthMirrorService } from '@core/utilities/services/auth-mirror.service';
import { ThemePreference, ThemeService } from '@app/core/utilities/services/theme.service';

interface ThemeOption {
  readonly value: ThemePreference;
  readonly label: string;
  readonly icon: string;
}

@Component({
  selector: 'app-settings',
  imports: [ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    @layer app {
      section {
        max-width: 34rem;
        margin-top: 1.5rem;
        padding: 1.25rem;
        border: 1px solid var(--app-border-color);
        border-radius: var(--app-radius);
      }

      h2 {
        margin-top: 0;
        font-size: 1.125rem;
      }

      .theme-options {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin: 0;
        padding: 0;
        border: 0;
      }

      .danger {
        border-color: var(--app-danger-color);
      }
    }
  `,
  template: `
    <h1>Paramètres</h1>

    <section aria-labelledby="theme-title">
      <h2 id="theme-title">Apparence</h2>
      <p>Choisissez le thème de l'interface. « Système » suit les réglages de votre appareil.</p>

      <div class="theme-options" role="radiogroup" aria-labelledby="theme-title">
        @for (option of themeOptions; track option.value) {
          <button
            type="button"
            ejs-button
            role="radio"
            [cssClass]="theme.preference() !== option.value ? 'e-outline' : ''"
            [attr.aria-checked]="theme.preference() === option.value"
            (click)="theme.setPreference(option.value)"
          >
            <i class="pi" [class]="option.icon" aria-hidden="true"></i>
            {{ option.label }}
          </button>
        }
      </div>
    </section>

    <section class="danger" aria-labelledby="session-title">
      <h2 id="session-title">Session</h2>
      <p>Vous serez déconnecté et renvoyé vers la page d'accueil.</p>
      <button type="button" ejs-button cssClass="e-danger" (click)="logout()">Se déconnecter</button>
    </section>
  `,
})
export class Settings {
  private readonly auth = inject(AuthMirrorService);
  private readonly router = inject(Router);

  protected readonly theme = inject(ThemeService);

  protected readonly themeOptions: readonly ThemeOption[] = [
    { value: 'light', label: 'Clair', icon: 'pi-sun' },
    { value: 'dark', label: 'Sombre', icon: 'pi-moon' },
    { value: 'system', label: 'Système', icon: 'pi-desktop' },
  ];

  protected logout(): void {
    this.auth.logout().subscribe({
      next: () => void this.router.navigateByUrl('/'),
      error: () => {
        this.auth.clearSession();
        void this.router.navigateByUrl('/');
      },
    });
  }
}
