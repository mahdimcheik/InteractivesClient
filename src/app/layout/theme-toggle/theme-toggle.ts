import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ButtonModule } from '@syncfusion/ej2-angular-buttons';

import { ThemeService } from '@app/core/utilities/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  imports: [ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      ejs-button
      cssClass="e-flat e-round e-icon-btn !flex !items-center !justify-center"
      [attr.aria-label]="label()"
      [attr.aria-pressed]="theme.isDark()"
      [title]="label()"
      (click)="theme.toggle()"
    >
      @if (theme.isDark()) {
        <svg
          class="size-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path
            stroke-linecap="round"
            d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
          />
        </svg>
      } @else {
        <svg class="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 1020.354 15.354z" />
        </svg>
      }
    </button>
  `,
})
export class ThemeToggle {
  protected readonly theme = inject(ThemeService);

  protected readonly label = computed(() =>
    this.theme.isDark() ? 'Activer le thème clair' : 'Activer le thème sombre',
  );
}
