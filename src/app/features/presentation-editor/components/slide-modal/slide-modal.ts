import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from '@syncfusion/ej2-angular-buttons';
import { ColorPickerModule } from '@syncfusion/ej2-angular-inputs';
import { DialogModule } from '@syncfusion/ej2-angular-popups';

@Component({
  selector: 'app-slide-modal',
  imports: [ReactiveFormsModule, ButtonModule, ColorPickerModule, DialogModule],
  templateUrl: './slide-modal.html',
  styleUrl: './slide-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlideModal {
  private readonly fb = inject(FormBuilder);

  readonly visible = model(false);
  readonly mode = input<'add' | 'edit'>('add');
  readonly initialColor = input('#ffffff');
  readonly saving = input(false);

  readonly confirmed = output<string>();

  protected readonly heading = computed(() =>
    this.mode() === 'add' ? 'Nouvelle diapositive' : "Modifier l'arrière-plan",
  );

  protected readonly confirmLabel = computed(() =>
    this.mode() === 'add' ? 'Créer' : 'Enregistrer',
  );

  protected readonly form = this.fb.nonNullable.group({
    backgroundColor: [''],
  });

  constructor() {
    effect(() => {
      if (this.visible()) {
        this.form.reset({ backgroundColor: this.initialColor() });
      }
    });
  }

  protected close(): void {
    this.visible.set(false);
  }

  protected submit(): void {
    this.confirmed.emit(this.form.controls.backgroundColor.value);
  }
}
