import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { ButtonModule } from '@syncfusion/ej2-angular-buttons';
import { DialogModule } from '@syncfusion/ej2-angular-popups';

/** Confirmation d'une suppression définitive, aux couleurs du thème courant. */
@Component({
  selector: 'app-confirm-delete-modal',
  imports: [ButtonModule, DialogModule],
  template: `
    <ejs-dialog
      [(visible)]="visible"
      [isModal]="true"
      [closeOnEscape]="!deleting()"
      [showCloseIcon]="!deleting()"
      [allowDragging]="false"
      [width]="'min(90vw, 420px)'"
      (overlayClick)="close()"
    >
      <ng-template #header>
        <h3 class="modal-title">{{ heading() }}</h3>
      </ng-template>

      <ng-template #content>
        <p class="modal-message">{{ message() }}</p>
      </ng-template>

      <ng-template #footerTemplate>
        <div class="modal-footer">
          <button
            type="button"
            ejs-button
            cssClass="e-outline"
            [disabled]="deleting()"
            (click)="close()"
          >
            Annuler
          </button>
          <button
            type="button"
            ejs-button
            cssClass="!bg-[var(--app-danger-color)] !text-[var(--app-background)]"
            [disabled]="deleting()"
            (click)="confirmed.emit()"
          >
            {{ deleting() ? 'Suppression…' : 'Supprimer' }}
          </button>
        </div>
      </ng-template>
    </ejs-dialog>
  `,
  styles: `
    @layer app {
      .modal-title {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 700;
      }

      .modal-message {
        margin: 0;
        line-height: 1.5;
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        padding-top: 0.5rem;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDeleteModal {
  readonly visible = model(false);
  readonly heading = input.required<string>();
  readonly message = input.required<string>();
  readonly deleting = input(false);

  readonly confirmed = output<void>();

  protected close(): void {
    if (!this.deleting()) {
      this.visible.set(false);
    }
  }
}
