import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  model,
  output,
  signal,
} from '@angular/core';
import { PresentationDetails, SlideDetails } from '@client/models';
import { NotificationService } from '@core/utilities/services/notification.service';
import { SlidesMirrorService } from '@core/utilities/services/slides-mirror.service';

import { SlideModal } from '../slide-modal/slide-modal';

@Component({
  selector: 'app-slide-panel',
  imports: [SlideModal, CdkDropList, CdkDrag, CdkDragHandle],
  templateUrl: './slide-panel.html',
  styleUrl: './slide-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlidePanel {
  private readonly slidesMirror = inject(SlidesMirrorService);
  private readonly notifications = inject(NotificationService);

  readonly selectedSlideIndex = input(0);
  presentation = model<PresentationDetails>();
  slides = linkedSignal<SlideDetails[]>(() => this.presentation()?.slides ?? []);
  readonly slideSelected = output<number>();

  protected readonly presentationId = computed(() => this.presentation()?.id);
  protected readonly slideModalVisible = signal(false);
  protected readonly slideModalMode = signal<'add' | 'edit'>('add');
  protected readonly editingSlide = signal<SlideDetails | undefined>(undefined);
  protected readonly savingSlide = signal(false);

  protected openAddModal(): void {
    if (!this.presentationId()) {
      return;
    }
    this.slideModalMode.set('add');
    this.editingSlide.set(undefined);
    this.slideModalVisible.set(true);
  }

  protected openEditModal(slide: SlideDetails): void {
    this.slideModalMode.set('edit');
    this.editingSlide.set(slide);
    this.slideModalVisible.set(true);
  }

  protected onSlideModalConfirm(backgroundColor: string): void {
    const presentationId = this.presentationId();
    if (!presentationId) {
      return;
    }

    this.savingSlide.set(true);

    if (this.slideModalMode() === 'add') {
      this.slidesMirror.create(presentationId, { backgroundColor }).subscribe({
        next: (slide) => {
          this.savingSlide.set(false);
          if (!slide) {
            return;
          }
          this.presentation.update((p) =>
            p ? { ...p, slides: [...(p.slides ?? []), slide] } : p,
          );
          this.slideModalVisible.set(false);
        },
        error: () => {
          this.savingSlide.set(false);
          this.notifications.add({
            severity: 'error',
            summary: 'Échec de la création',
            detail: "La diapositive n'a pas pu être créée.",
          });
        },
      });
      return;
    }

    const slideId = this.editingSlide()?.id;
    if (!slideId) {
      this.savingSlide.set(false);
      return;
    }

    this.slidesMirror.update(presentationId, slideId, { backgroundColor }).subscribe({
      next: (slide) => {
        this.savingSlide.set(false);
        if (!slide) {
          return;
        }
        this.presentation.update((p) =>
          p ? { ...p, slides: (p.slides ?? []).map((s) => (s.id === slide.id ? slide : s)) } : p,
        );
        this.slideModalVisible.set(false);
      },
      error: () => {
        this.savingSlide.set(false);
        this.notifications.add({
          severity: 'error',
          summary: 'Échec de la modification',
          detail: "L'arrière-plan n'a pas pu être enregistré.",
        });
      },
    });
  }

  protected onDrop(event: CdkDragDrop<SlideDetails[]>): void {
    const presentationId = this.presentationId();
    if (!presentationId || event.previousIndex === event.currentIndex) {
      return;
    }

    const previous = this.slides();
    const reordered = [...previous];
    moveItemInArray(reordered, event.previousIndex, event.currentIndex);
    this.presentation.update((p) => (p ? { ...p, slides: reordered } : p));

    if (this.selectedSlideIndex() === event.previousIndex) {
      this.slideSelected.emit(event.currentIndex);
    }

    this.slidesMirror.reorder(presentationId, reordered.map((s) => s.id!)).subscribe({
      error: () => {
        this.presentation.update((p) => (p ? { ...p, slides: previous } : p));
        this.notifications.add({
          severity: 'error',
          summary: 'Échec de la réorganisation',
          detail: "L'ordre des diapositives n'a pas pu être enregistré.",
        });
      },
    });
  }
}
