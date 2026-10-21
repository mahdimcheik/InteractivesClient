import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { PresentationDetails, SlideDetails } from '@client/models';
import { PresentationMode } from '@core/utilities/models/enumerators';
import { NotificationService } from '@core/utilities/services/notification.service';
import { SlidesMirrorService } from '@core/utilities/services/slides-mirror.service';
import { Store } from '@core/utilities/services/store';

import { ConfirmDeleteModal } from '../confirm-delete-modal/confirm-delete-modal';
import { SlideModal } from '../slide-modal/slide-modal';
import { SlideView } from '../slide-view/slide-view';

@Component({
  selector: 'app-slide-panel',
  imports: [SlideModal, SlideView, ConfirmDeleteModal, CdkDropList, CdkDrag, CdkDragHandle],
  templateUrl: './slide-panel.html',
  styleUrl: './slide-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlidePanel {
  private readonly slidesMirror = inject(SlidesMirrorService);
  private readonly notifications = inject(NotificationService);
  private readonly store = inject(Store);

  readonly selectedSlideIndex = input(0);
  readonly presentation = input<PresentationDetails>();
  protected readonly slides = computed<SlideDetails[]>(() => this.presentation()?.slides ?? []);
  readonly slideSelected = output<number>();

  protected readonly presentationId = computed(() => this.presentation()?.id);
  protected readonly thumbnailMode = PresentationMode.Thumbnail;
  protected readonly slideModalVisible = signal(false);
  protected readonly slideModalMode = signal<'add' | 'edit'>('add');
  protected readonly editingSlide = signal<SlideDetails | undefined>(undefined);
  protected readonly savingSlide = signal(false);
  protected readonly slidePendingDeletion = signal<{ slide: SlideDetails; index: number } | null>(
    null,
  );
  protected readonly deleteModalVisible = signal(false);
  protected readonly deletingSlide = signal(false);

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
          if (slide) {
            this.slideModalVisible.set(false);
          }
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
        if (slide) {
          this.slideModalVisible.set(false);
        }
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
    this.store.setSlidesForPresentationDetails(presentationId, reordered);

    if (this.selectedSlideIndex() === event.previousIndex) {
      this.slideSelected.emit(event.currentIndex);
    }

    this.slidesMirror
      .reorder(
        presentationId,
        reordered.map((s) => s.id!),
      )
      .subscribe({
        error: () => {
          this.store.setSlidesForPresentationDetails(presentationId, previous);
          this.notifications.add({
            severity: 'error',
            summary: 'Échec de la réorganisation',
            detail: "L'ordre des diapositives n'a pas pu être enregistré.",
          });
        },
      });
  }

  protected askDelete(slide: SlideDetails, index: number): void {
    this.slidePendingDeletion.set({ slide, index });
    this.deleteModalVisible.set(true);
  }

  protected confirmDelete(): void {
    const presentationId = this.presentationId();
    const pending = this.slidePendingDeletion();
    if (!presentationId || !pending?.slide.id) {
      return;
    }

    this.deletingSlide.set(true);
    this.slidesMirror.remove(presentationId, pending.slide.id).subscribe({
      next: () => {
        this.deletingSlide.set(false);
        this.deleteModalVisible.set(false);
        const selected = this.selectedSlideIndex();
        if (pending.index < selected || selected >= this.slides().length) {
          this.slideSelected.emit(Math.max(selected - 1, 0));
        }
      },
      error: () => {
        this.deletingSlide.set(false);
        this.notifications.add({
          severity: 'error',
          summary: 'Échec de la suppression',
          detail: "La diapositive n'a pas pu être supprimée.",
        });
      },
    });
  }
}
