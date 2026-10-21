import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from '@syncfusion/ej2-angular-buttons';

import { PresentationSummary } from '@client';
import { NotificationService } from '@core/utilities/services/notification.service';
import { PresentationsMirrorService } from '@core/utilities/services/presentations-mirror.service';

import { ConfirmDeleteModal } from '../components/confirm-delete-modal/confirm-delete-modal';
import { PresentationCard } from '../components/presentation-card/presentation-card';

@Component({
  selector: 'app-my-presentations',
  imports: [PresentationCard, ConfirmDeleteModal, ButtonModule],
  templateUrl: './my-presentations.html',
  styleUrl: './my-presentations.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyPresentations {
  private readonly presentationsMirror = inject(PresentationsMirrorService);
  private readonly router = inject(Router);

  private readonly notifications = inject(NotificationService);

  protected readonly presentations = this.presentationsMirror.presentations;
  protected readonly pendingDeletion = signal<PresentationSummary | null>(null);
  protected readonly deleteModalVisible = signal(false);
  protected readonly deleting = signal(false);

  constructor() {
    this.presentationsMirror.list().subscribe();
  }

  protected createPresentation(): void {
    void this.router.navigate(['/dashboard/editeur', 'new']);
  }

  protected askDelete(presentation: PresentationSummary): void {
    this.pendingDeletion.set(presentation);
    this.deleteModalVisible.set(true);
  }

  protected confirmDelete(): void {
    const id = this.pendingDeletion()?.id;
    if (!id) {
      return;
    }
    this.deleting.set(true);
    this.presentationsMirror.remove(id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteModalVisible.set(false);
      },
      error: () => {
        this.deleting.set(false);
        this.notifications.add({
          severity: 'error',
          summary: 'Échec de la suppression',
          detail: "La présentation n'a pas pu être supprimée.",
        });
      },
    });
  }
}
