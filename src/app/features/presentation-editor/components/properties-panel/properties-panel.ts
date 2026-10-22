import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ElementDetails, SlideDetails } from '@client';
import { SlideRect, clampRect, elementRect } from '@core/utilities/models/slide-geometry';
import { SLIDE_DEFAULT_BACKGROUND } from '@core/utilities/models/slide-style';
import { ElementsMirrorService } from '@core/utilities/services/elements-mirror.service';
import { NotificationService } from '@core/utilities/services/notification.service';
import { SlidesMirrorService } from '@core/utilities/services/slides-mirror.service';

import { ELEMENT_PANELS, elementLabel } from '@app/shared/slides/elements/element-registry';

/**
 * Propriétés de l'élément sélectionné (position et taille communes, puis le panneau propre à son
 * type, déclaré dans `ELEMENT_PANELS`) ; sans sélection, celles de la diapositive.
 */
@Component({
  selector: 'app-properties-panel',
  imports: [NgComponentOutlet],
  templateUrl: './properties-panel.html',
  styleUrl: './properties-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertiesPanel {
  private readonly elementsMirror = inject(ElementsMirrorService);
  private readonly slidesMirror = inject(SlidesMirrorService);
  private readonly notifications = inject(NotificationService);

  readonly presentationId = input<string>();
  readonly slide = input<SlideDetails>();
  readonly element = input<ElementDetails>();

  protected readonly geometryFields: readonly { key: keyof SlideRect; label: string }[] = [
    { key: 'x', label: 'X' },
    { key: 'y', label: 'Y' },
    { key: 'width', label: 'Largeur' },
    { key: 'height', label: 'Hauteur' },
  ];
  protected readonly defaultBackground = SLIDE_DEFAULT_BACKGROUND;
  protected readonly elementLabel = elementLabel;

  protected readonly rect = computed(() => {
    const element = this.element();
    return element ? elementRect(element) : undefined;
  });
  protected readonly elementPanel = computed(() => {
    const type = this.element()?.type;
    return type ? (ELEMENT_PANELS[type] ?? null) : null;
  });

  protected saveGeometry(element: ElementDetails, key: keyof SlideRect, value: number): void {
    const presentationId = this.presentationId();
    if (!presentationId || !element.id || !element.slideId || !Number.isFinite(value)) {
      return;
    }
    const rect = clampRect({ ...elementRect(element), [key]: value });
    this.elementsMirror.patch(presentationId, element.slideId, element.id, rect).subscribe({
      error: () => this.notifyError('La position n’a pas pu être enregistrée.'),
    });
  }

  protected saveBackground(slide: SlideDetails, backgroundColor: string): void {
    const presentationId = this.presentationId();
    if (!presentationId || !slide.id) {
      return;
    }
    this.slidesMirror.update(presentationId, slide.id, { backgroundColor }).subscribe({
      error: () => this.notifyError('L’arrière-plan n’a pas pu être enregistré.'),
    });
  }

  private notifyError(detail: string): void {
    this.notifications.add({ severity: 'error', summary: 'Échec de l’enregistrement', detail });
  }
}
