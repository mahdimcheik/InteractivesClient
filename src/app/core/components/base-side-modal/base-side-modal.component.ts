import { isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, inject, input, model, PLATFORM_ID, signal } from '@angular/core';
import { ButtonModule } from '@syncfusion/ej2-angular-buttons';
import { SidebarModule } from '@syncfusion/ej2-angular-navigations';

const NARROW_VIEWPORT_QUERY = '(max-width: 767px)';

@Component({
  selector: 'bp-base-side-modal',
  imports: [SidebarModule, ButtonModule],
  templateUrl: './base-side-modal.component.html',
  styleUrl: './base-side-modal.component.scss',
})
export class BaseSideModalComponent {
  destroyRef = inject(DestroyRef);

  visible = model(false);
  title = input<string>('Titre');
  iconClass = input<string>('pi pi-info-circle');
  position = input<'Left' | 'Right'>('Right');
  width = signal<string>('50vw');

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) {
      return;
    }

    const mediaQuery = window.matchMedia(NARROW_VIEWPORT_QUERY);
    this.width.set(mediaQuery.matches ? '100vw' : '50vw');

    const onChange = (event: MediaQueryListEvent) => {
      this.width.set(event.matches ? '100vw' : '50vw');
    };
    mediaQuery.addEventListener('change', onChange);
    this.destroyRef.onDestroy(() => mediaQuery.removeEventListener('change', onChange));
  }

  onHide = () => {
    this.visible.set(false);
  };
}
