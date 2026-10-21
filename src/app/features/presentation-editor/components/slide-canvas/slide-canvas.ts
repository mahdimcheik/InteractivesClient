import { CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  model,
  viewChild,
} from '@angular/core';
import { PresentationDetails } from '@client';
import { PresentationMode } from '@core/utilities/models/enumerators';
import { ElementsMirrorService } from '@core/utilities/services/elements-mirror.service';
import { NotificationService } from '@core/utilities/services/notification.service';

import { ELEMENT_COMPONENTS, findElementPreset } from './elements/element-registry';

@Component({
  selector: 'app-slide-canvas',
  imports: [CdkDropList, NgComponentOutlet],
  templateUrl: './slide-canvas.html',
  styleUrl: './slide-canvas.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlideCanvas {
  private readonly elementsMirror = inject(ElementsMirrorService);
  private readonly notifications = inject(NotificationService);

  presentation = model<PresentationDetails>();
  readonly selectedSlideIndex = input(0);
  readonly mode = input<PresentationMode>(PresentationMode.Edit);

  private readonly slideRef = viewChild<ElementRef<HTMLDivElement>>('slideRef');

  protected readonly presentationId = computed(() => this.presentation()?.id);
  protected readonly slide = computed(
    () => this.presentation()?.slides?.[this.selectedSlideIndex()],
  );
  protected readonly elementComponents = ELEMENT_COMPONENTS;

  protected onElementDropped(event: CdkDragDrop<unknown, unknown, string>): void {
    const presentationId = this.presentationId();
    const slide = this.slide();
    const slideRef = this.slideRef();
    const preset = findElementPreset(event.item.data);
    if (!presentationId || !slide?.id || !slideRef || !preset) {
      return;
    }

    const rect = slideRef.nativeElement.getBoundingClientRect();
    const x = Math.round(event.dropPoint.x - rect.left);
    const y = Math.round(event.dropPoint.y - rect.top);

    this.elementsMirror
      .create(presentationId, slide.id, {
        type: preset.type,
        x,
        y,
        width: preset.size.width,
        height: preset.size.height,
        zIndex: slide.elements?.length ?? 0,
        configuration: preset.configuration,
      })
      .subscribe({
        next: (created) => {
          if (!created) {
            return;
          }
          this.presentation.update((p) => {
            if (!p) {
              return p;
            }
            return {
              ...p,
              slides: (p.slides ?? []).map((s) =>
                s.id === slide.id ? { ...s, elements: [...(s.elements ?? []), created] } : s,
              ),
            };
          });
        },
        error: () =>
          this.notifications.add({
            severity: 'error',
            summary: 'Échec de l’ajout',
            detail: 'L’élément n’a pas pu être ajouté à la diapositive.',
          }),
      });
  }
}
