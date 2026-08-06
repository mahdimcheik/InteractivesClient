import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { UpdateElementRequest } from '@client';
import { SlideElementBase } from '@core/utilities/models/slide-element-base';
import { ElementsMirrorService } from '@core/utilities/services/elements-mirror.service';
import { NotificationService } from '@core/utilities/services/notification.service';

import { TextElementConfig } from './text-element.model';

@Component({
  selector: 'app-text-element',
  template: `
    <div
      class="text-element"
      [class.is-editable]="isEditable()"
      [attr.contenteditable]="isEditable() ? 'true' : null"
      (blur)="onBlur($event)"
    >
      {{ text() }}
    </div>
  `,
  styleUrl: './text-element.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextElement extends SlideElementBase {
  private readonly elementsMirror = inject(ElementsMirrorService);
  private readonly notifications = inject(NotificationService);

  /** Plomberie de persistance, pas une préoccupation d'affichage partagée — pas sur SlideElementBase. */
  readonly presentationId = input.required<string>();

  protected readonly text = computed(() => (this.config() as TextElementConfig).content ?? '');

  protected onBlur(event: FocusEvent): void {
    if (!this.isEditable()) {
      return;
    }
    const newText = (event.target as HTMLElement).innerText.trim();
    if (newText === this.text()) {
      return;
    }

    const el = this.element();
    if (!el.id || !el.slideId) {
      return;
    }

    const payload: UpdateElementRequest = {
      x: el.x ?? 0,
      y: el.y ?? 0,
      width: el.width ?? 0,
      height: el.height ?? 0,
      rotation: el.rotation,
      zIndex: el.zIndex,
      locked: el.locked,
      visible: el.visible,
      configuration: JSON.stringify({ content: newText } satisfies TextElementConfig),
    };

    this.elementsMirror.update(this.presentationId(), el.slideId, el.id, payload).subscribe({
      error: () =>
        this.notifications.add({
          severity: 'error',
          summary: 'Échec de l’enregistrement',
          detail: 'Le texte n’a pas pu être enregistré.',
        }),
    });
  }
}
