import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from '@syncfusion/ej2-angular-buttons';
import { TextBoxModule } from '@syncfusion/ej2-angular-inputs';
import { DialogModule } from '@syncfusion/ej2-angular-popups';

@Component({
  selector: 'app-presentation-name-modal',
  imports: [ReactiveFormsModule, ButtonModule, TextBoxModule, DialogModule],
  templateUrl: './presentation-name-modal.html',
  styleUrl: './presentation-name-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PresentationNameModal {
  private readonly fb = inject(FormBuilder);

  readonly visible = model(false);
  readonly initialTitle = input('');
  readonly heading = input('Nommer la présentation');
  readonly confirmLabel = input('Enregistrer');
  /** `false` pour la création : impossible de fermer sans nommer la présentation. */
  readonly dismissible = input(true);
  readonly saving = input(false);

  readonly confirmed = output<string>();

  protected readonly form = this.fb.nonNullable.group({
    title: [''],
  });

  constructor() {
    effect(() => {
      if (this.visible()) {
        this.form.reset({ title: this.initialTitle() });
      }
    });
  }

  protected showError(): boolean {
    const control = this.form.controls.title;
    return control.invalid && control.touched;
  }

  protected fieldAttrs(): Record<string, string> {
    const hasError = this.showError();
    const attrs: Record<string, string> = {
      id: 'presentation-title',
      'aria-invalid': String(hasError),
    };
    if (hasError) {
      attrs['aria-describedby'] = 'presentation-title-error';
    }
    return attrs;
  }

  protected close(): void {
    if (this.dismissible()) {
      this.visible.set(false);
    }
  }

  protected submit(): void {
    const title = this.form.controls.title.value.trim();
    if (!title) {
      this.form.controls.title.setErrors({ required: true });
      this.form.markAllAsTouched();
      return;
    }

    this.confirmed.emit(title);
  }
}
