import { CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  viewChild,
} from '@angular/core';
import { ElementDetails, PresentationDetails } from '@client';
import { PresentationMode } from '@core/utilities/models/enumerators';
import { SlideRect, clampRect } from '@core/utilities/models/slide-geometry';
import {
  ElementChanges,
  ElementsMirrorService,
} from '@core/utilities/services/elements-mirror.service';
import { NotificationService } from '@core/utilities/services/notification.service';

import { SlideStage } from '../slide-stage/slide-stage';
import { ElementAction, ElementFrame } from './element-frame/element-frame';
import { ELEMENT_COMPONENTS, elementLabel, findElementPreset } from './elements/element-registry';

@Component({
  selector: 'app-slide-canvas',
  imports: [CdkDropList, NgComponentOutlet, SlideStage, ElementFrame],
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

  protected readonly stage = viewChild(SlideStage);

  protected readonly presentationId = computed(() => this.presentation()?.id);
  protected readonly slide = computed(
    () => this.presentation()?.slides?.[this.selectedSlideIndex()],
  );
  protected readonly isEditMode = computed(() => this.mode() === PresentationMode.Edit);
  /** Hors édition, un élément masqué n'est pas rendu du tout. */
  protected readonly renderedElements = computed(() => {
    const elements = this.slide()?.elements ?? [];
    return this.isEditMode() ? elements : elements.filter((e) => e.visible !== false);
  });
  /** Effacée quand on change de diapositive ou de mode. */
  protected readonly selectedElementId = linkedSignal<string, string | null>({
    source: () => `${this.slide()?.id}|${this.mode()}`,
    computation: () => null,
  });
  protected readonly elementComponents = ELEMENT_COMPONENTS;
  protected readonly elementLabel = elementLabel;

  protected onStagePointerDown(event: PointerEvent): void {
    if (!(event.target as HTMLElement).closest('app-element-frame')) {
      this.selectedElementId.set(null);
    }
  }

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
        zIndex: this.zIndexRange().max + 1,
        visible: true,
        configuration: preset.configuration,
      })
      .subscribe({
        next: (created) => this.selectedElementId.set(created?.id ?? null),
        error: () => this.notifyError('Échec de l’ajout', 'L’élément n’a pas pu être ajouté.'),
      });
  }

  protected onRectCommitted(element: ElementDetails, rect: SlideRect): void {
    this.patch(element, rect);
  }

  protected onAction(element: ElementDetails, action: ElementAction): void {
    switch (action) {
      case 'front':
        this.patch(element, { zIndex: this.zIndexRange().max + 1 });
        break;
      case 'back':
        this.patch(element, { zIndex: this.zIndexRange().min - 1 });
        break;
      case 'lock':
        this.patch(element, { locked: !element.locked });
        break;
      case 'hide':
        this.patch(element, { visible: element.visible === false });
        break;
      case 'remove':
        this.remove(element);
        break;
    }
  }

  private zIndexRange(): { min: number; max: number } {
    const values = (this.slide()?.elements ?? []).map((e) => e.zIndex ?? 0);
    return values.length
      ? { min: Math.min(...values), max: Math.max(...values) }
      : { min: 0, max: -1 };
  }

  private patch(element: ElementDetails, changes: ElementChanges): void {
    const presentationId = this.presentationId();
    if (!presentationId || !element.slideId || !element.id) {
      return;
    }
    this.elementsMirror.patch(presentationId, element.slideId, element.id, changes).subscribe({
      error: () =>
        this.notifyError(
          'Échec de l’enregistrement',
          'La modification n’a pas pu être enregistrée.',
        ),
    });
  }

  private remove(element: ElementDetails): void {
    const presentationId = this.presentationId();
    if (!presentationId || !element.slideId || !element.id) {
      return;
    }
    this.elementsMirror.remove(presentationId, element.slideId, element.id).subscribe({
      next: () => {
        if (this.selectedElementId() === element.id) {
          this.selectedElementId.set(null);
        }
      },
      error: () =>
        this.notifyError('Échec de la suppression', 'L’élément n’a pas pu être supprimé.'),
    });
  }

  private notifyError(summary: string, detail: string): void {
    this.notifications.add({ severity: 'error', summary, detail });
  }
}
