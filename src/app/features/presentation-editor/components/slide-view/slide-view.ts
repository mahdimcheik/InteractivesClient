import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SlideDetails } from '@client';
import { PresentationMode } from '@core/utilities/models/enumerators';
import { SLIDE_DEFAULT_BACKGROUND } from '@core/utilities/models/slide-style';

import { ELEMENT_COMPONENTS } from '../slide-canvas/elements/element-registry';
import { SlideStage } from '../slide-stage/slide-stage';

/**
 * Une diapositive en lecture seule, mise à l'échelle de la largeur disponible : lecteur de
 * l'hôte (`Presentation`), miniatures (`Thumbnail`), et demain participants (`Client`).
 * Les éléments masqués ne sont pas rendus. Une miniature est décorative : retirée de l'arbre
 * d'accessibilité et inerte, c'est son conteneur qui la nomme.
 */
@Component({
  selector: 'app-slide-view',
  imports: [NgComponentOutlet, SlideStage],
  template: `
    <app-slide-stage [style.background-color]="background()">
      @for (element of elements(); track element.id) {
        <div
          class="slide-element"
          [style.left.px]="element.x"
          [style.top.px]="element.y"
          [style.width.px]="element.width"
          [style.height.px]="element.height"
          [style.zIndex]="element.zIndex ?? 0"
        >
          <ng-container
            [ngComponentOutlet]="components[element.type!] ?? null"
            [ngComponentOutletInputs]="{ element, mode: mode(), presentationId: presentationId() }"
          />
        </div>
      }
    </app-slide-stage>
  `,
  styles: `
    @layer app {
      :host {
        display: block;
      }

      .slide-element {
        position: absolute;
        box-sizing: border-box;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.aria-hidden]': "isThumbnail() ? 'true' : null",
    '[inert]': 'isThumbnail()',
  },
})
export class SlideView {
  readonly slide = input.required<SlideDetails>();
  readonly presentationId = input.required<string>();
  readonly mode = input.required<PresentationMode>();

  protected readonly components = ELEMENT_COMPONENTS;
  protected readonly isThumbnail = computed(() => this.mode() === PresentationMode.Thumbnail);
  protected readonly background = computed(
    () => this.slide().backgroundColor || SLIDE_DEFAULT_BACKGROUND,
  );
  protected readonly elements = computed(() =>
    (this.slide().elements ?? []).filter((element) => element.visible !== false),
  );
}
