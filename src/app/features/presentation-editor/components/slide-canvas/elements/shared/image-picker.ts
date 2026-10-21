import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { StorageVisibilityEnum, StoredFile } from '@client';
import { MediasMirrorService } from '@core/utilities/services/medias-mirror.service';
import { NotificationService } from '@core/utilities/services/notification.service';

/**
 * Sélection + envoi d'une image. Visibilité `Public` : les participants doivent pouvoir charger
 * l'image sans URL signée.
 */
@Component({
  selector: 'app-image-picker',
  template: `
    <label class="image-picker" [class.is-compact]="compact()" [class.is-busy]="uploading()">
      <input
        type="file"
        accept="image/*"
        class="app-visually-hidden"
        [disabled]="uploading()"
        (change)="onFileSelected($event)"
      />
      <i
        class="pi"
        [class]="uploading() ? 'pi-spin pi-spinner' : 'pi-image'"
        aria-hidden="true"
      ></i>
      <span>{{ uploading() ? 'Envoi en cours…' : label() }}</span>
    </label>
  `,
  styleUrl: './image-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImagePicker {
  private readonly medias = inject(MediasMirrorService);
  private readonly notifications = inject(NotificationService);

  readonly presentationId = input.required<string>();
  readonly label = input('Choisir une image');
  readonly compact = input(false);

  readonly picked = output<StoredFile>();

  protected readonly uploading = signal(false);

  protected onFileSelected(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl.files?.[0];
    inputEl.value = '';
    if (!file) {
      return;
    }

    this.uploading.set(true);
    this.medias
      .upload(file, {
        folder: `presentations/${this.presentationId()}`,
        visibility: StorageVisibilityEnum.Public,
      })
      .subscribe({
        next: (res) => {
          this.uploading.set(false);
          if (res.data?.url) {
            this.picked.emit(res.data);
          } else {
            this.notifyError();
          }
        },
        error: () => {
          this.uploading.set(false);
          this.notifyError();
        },
      });
  }

  private notifyError(): void {
    this.notifications.add({
      severity: 'error',
      summary: 'Échec de l’envoi',
      detail: 'L’image n’a pas pu être envoyée.',
    });
  }
}
