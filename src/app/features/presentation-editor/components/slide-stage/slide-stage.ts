import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { SLIDE_HEIGHT, SLIDE_WIDTH } from '@core/utilities/models/slide-geometry';

/**
 * Surface d'une diapositive : occupe toute la largeur disponible au format 16:9 et met à l'échelle
 * son contenu, positionné dans le repère logique {@link SLIDE_WIDTH} × {@link SLIDE_HEIGHT}.
 * L'échelle est exposée en CSS (`--slide-scale`) pour les contrôles d'édition qui doivent garder
 * une taille lisible à l'écran.
 */
@Component({
  selector: 'app-slide-stage',
  template: `
    <div
      class="stage"
      [style.width.px]="width"
      [style.height.px]="height"
      [style.transform]="'scale(' + scale() + ')'"
      [style.--slide-scale]="scale()"
    >
      <ng-content />
    </div>
  `,
  styleUrl: './slide-stage.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlideStage {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly width = SLIDE_WIDTH;
  protected readonly height = SLIDE_HEIGHT;

  /** Pixels d'écran par unité logique. */
  readonly scale = signal(1);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const element = this.host.nativeElement;
      const measure = () => this.scale.set(element.clientWidth / SLIDE_WIDTH || 1);
      measure();
      if (typeof ResizeObserver === 'undefined') {
        return;
      }
      const observer = new ResizeObserver(measure);
      observer.observe(element);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  /** Convertit un point de l'écran (`clientX`/`clientY`) en coordonnées logiques. */
  toSlidePoint(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.host.nativeElement.getBoundingClientRect();
    const scale = this.scale();
    return { x: (clientX - rect.left) / scale, y: (clientY - rect.top) / scale };
  }
}
