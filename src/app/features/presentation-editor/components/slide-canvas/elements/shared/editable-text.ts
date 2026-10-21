import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Texte éditable en place (`contenteditable`) en mode édition, statique sinon.
 * `[textContent]` plutôt qu'une interpolation : à chaque changement de valeur, Angular remplace
 * tout le contenu, y compris les nœuds que le navigateur a ajoutés pendant la saisie.
 */
@Component({
  selector: 'app-editable-text',
  template: `
    <div
      class="editable-text"
      [class.is-editable]="editable()"
      [class.is-heading]="heading()"
      [attr.contenteditable]="editable() ? 'true' : null"
      [attr.role]="heading() ? 'heading' : editable() ? 'textbox' : null"
      [attr.aria-level]="heading() ? 2 : null"
      [attr.aria-multiline]="editable() && !heading() ? 'true' : null"
      [attr.aria-label]="editable() ? label() : null"
      [attr.data-placeholder]="placeholder()"
      [textContent]="text()"
      (blur)="onBlur($event)"
    ></div>
  `,
  styleUrl: './editable-text.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditableText {
  readonly text = input.required<string>();
  readonly editable = input(false);
  readonly heading = input(false);
  readonly label = input('Texte');
  readonly placeholder = input('');

  readonly committed = output<string>();

  protected onBlur(event: FocusEvent): void {
    if (!this.editable()) {
      return;
    }
    const value = (event.target as HTMLElement).innerText.trim();
    if (value !== this.text()) {
      this.committed.emit(value);
    }
  }
}
