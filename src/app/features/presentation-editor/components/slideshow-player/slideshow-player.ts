import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { PresentationDetails } from '@client';
import { PresentationMode } from '@core/utilities/models/enumerators';

import { SlideView } from '@app/shared/slides/slide-view/slide-view';

const NEXT_KEYS = new Set(['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter']);
const PREVIOUS_KEYS = new Set(['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace']);

/**
 * Lecteur plein écran de l'hôte, en mode `Presentation`. Clavier : suivante (flèche droite ou
 * bas, espace, Entrée, Page suivante), précédente (flèche gauche ou haut, Page précédente),
 * Début / Fin, `Échap` pour quitter. Un clic sur la diapositive passe à la suivante.
 * `closed` émet l'index de la dernière diapositive affichée.
 */
@Component({
  selector: 'app-slideshow-player',
  imports: [SlideView],
  templateUrl: './slideshow-player.html',
  styleUrl: './slideshow-player.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'dialog',
    'aria-modal': 'true',
    'aria-label': 'Présentation',
    tabindex: '-1',
    '(keydown)': 'onKeyDown($event)',
  },
})
export class SlideshowPlayer {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);

  readonly presentation = input.required<PresentationDetails>();
  readonly startIndex = input(0);
  readonly closed = output<number>();

  protected readonly presentationMode = PresentationMode.Presentation;
  protected readonly slides = computed(() => this.presentation().slides ?? []);
  protected readonly index = linkedSignal(() =>
    Math.min(Math.max(this.startIndex(), 0), Math.max(this.slides().length - 1, 0)),
  );
  protected readonly current = computed(() => this.slides()[this.index()]);
  protected readonly isFirst = computed(() => this.index() === 0);
  protected readonly isLast = computed(() => this.index() >= this.slides().length - 1);

  constructor() {
    const onFullscreenChange = () => {
      // Le navigateur quitte le plein écran sur Échap sans transmettre la touche : on suit.
      if (!this.document.fullscreenElement) {
        this.close();
      }
    };
    afterNextRender(() => {
      const element = this.host.nativeElement;
      element.focus();
      this.document.addEventListener('fullscreenchange', onFullscreenChange);
      element.requestFullscreen?.().catch(() => {
        // Plein écran refusé (iframe, navigateur) : le lecteur couvre déjà la fenêtre.
      });
    });
    inject(DestroyRef).onDestroy(() => {
      this.document.removeEventListener('fullscreenchange', onFullscreenChange);
      if (this.document.fullscreenElement) {
        void this.document.exitFullscreen?.().catch(() => undefined);
      }
    });
  }

  protected next(): void {
    if (!this.isLast()) {
      this.index.update((i) => i + 1);
    }
  }

  protected previous(): void {
    if (!this.isFirst()) {
      this.index.update((i) => i - 1);
    }
  }

  protected close(): void {
    this.closed.emit(this.index());
  }

  protected onKeyDown(event: KeyboardEvent): void {
    // Sur un bouton des commandes, Entrée et espace l'activent : on ne les détourne pas.
    if (
      (event.target as HTMLElement).closest('button') &&
      (event.key === 'Enter' || event.key === ' ')
    ) {
      return;
    }
    if (NEXT_KEYS.has(event.key)) {
      this.next();
    } else if (PREVIOUS_KEYS.has(event.key)) {
      this.previous();
    } else if (event.key === 'Home') {
      this.index.set(0);
    } else if (event.key === 'End') {
      this.index.set(Math.max(this.slides().length - 1, 0));
    } else if (event.key === 'Escape') {
      this.close();
    } else {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
  }
}
