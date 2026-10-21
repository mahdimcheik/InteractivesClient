import { CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { PresentationDetails } from '@client';
import { PresentationMode } from '@core/utilities/models/enumerators';
import { clampRect } from '@core/utilities/models/slide-geometry';
import { ElementsMirrorService } from '@core/utilities/services/elements-mirror.service';
import { NotificationService } from '@core/utilities/services/notification.service';

import { SlideStage } from '../slide-stage/slide-stage';
import { ELEMENT_COMPONENTS, findElementPreset } from './elements/element-registry';

@Component({
  selector: 'app-slide-canvas',
  imports: [CdkDropList, NgComponentOutlet, SlideStage],
  templateUrl: './slide-canvas.html',
  styleUrl: './slide-canvas.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlideCanvas {
  private readonly elementsMirror = inject(ElementsMirrorService);
  private readonly notifications = inject(NotificationService);

  readonly presentation = input<PresentationDetails>();
  readonly selectedSlideIndex = input(0);
  readonly mode = input<PresentationMode>(PresentationMode.Edit);

  private readonly stage = viewChild(SlideStage);

  protected readonly presentationId = computed(() => this.presentation()?.id);
  protected readonly slide = computed(
    () => this.presentation()?.slides?.[this.selectedSlideIndex()],
  );
  protected readonly elementComponents = ELEMENT_COMPONENTS;

  protected onElementDropped(event: CdkDragDrop<unknown, unknown, string>): void {
    const presentationId = this.presentationId();
    const slide = this.slide();
    const stage = this.stage();
    const preset = findElementPreset(event.item.data);
    if (!presentationId || !slide?.id || !stage || !preset) {
      return;
    }

    // Centré sur le point de dépôt, puis ramené dans la diapositive.
    const point = stage.toSlidePoint(event.dropPoint.x, event.dropPoint.y);
    const rect = clampRect({
      x: point.x - preset.size.width / 2,
      y: point.y - preset.size.height / 2,
      ...preset.size,
    });

    this.elementsMirror
      .create(presentationId, slide.id, {
        type: preset.type,
        ...rect,
        zIndex: slide.elements?.length ?? 0,
        configuration: preset.configuration,
      })
      .subscribe({
        error: () =>
          this.notifications.add({
            severity: 'error',
            summary: 'Échec de l’ajout',
            detail: 'L’élément n’a pas pu être ajouté à la diapositive.',
          }),
      });
  }
}
