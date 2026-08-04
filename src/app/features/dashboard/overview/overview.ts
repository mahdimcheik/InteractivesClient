import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { Store } from '@core/utilities/services/store';

interface Stat {
  readonly label: string;
  readonly value: string;
  readonly icon: string;
}

@Component({
  selector: 'app-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    @layer app {
      .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
        gap: 1rem;
        margin-top: 1.5rem;
      }

      .stat {
        padding: 1.25rem;
        border: 1px solid var(--app-border-color);
        border-radius: var(--app-radius);
      }

      .stat-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0;
        color: var(--app-text-muted-color);
        font-size: 0.875rem;
      }

      .stat-value {
        margin: 0.375rem 0 0;
        font-size: 1.75rem;
        font-weight: 700;
      }
    }
  `,
  template: `
    <h1>Bonjour {{ firstName() }}</h1>
    <p>Voici un aperçu de votre activité. Remplacez ces chiffres par les données du projet.</p>

    <div class="stats">
      @for (stat of stats(); track stat.label) {
        <article class="stat">
          <p class="stat-label">
            <i class="pi" [class]="stat.icon" aria-hidden="true"></i>
            {{ stat.label }}
          </p>
          <p class="stat-value">{{ stat.value }}</p>
        </article>
      }
    </div>
  `,
})
export class Overview {
  private readonly store = inject(Store);

  protected readonly firstName = computed(() => this.store.user()?.firstName ?? '');

  /** Données de démonstration : à brancher sur l'API du projet. */
  protected readonly stats = signal<readonly Stat[]>([
    { label: 'Commandes', value: '12', icon: 'pi-shopping-cart' },
    { label: 'En cours', value: '3', icon: 'pi-clock' },
    { label: 'Messages', value: '5', icon: 'pi-envelope' },
    { label: 'Total dépensé', value: '1 240 €', icon: 'pi-wallet' },
  ]);
}
