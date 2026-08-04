import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from '@syncfusion/ej2-angular-buttons';
import { TextAreaModule, TextBoxModule } from '@syncfusion/ej2-angular-inputs';
import { NotificationService } from '@core/utilities/services/notification.service';

import { ContactService } from './contact.service';

@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule, ButtonModule, TextBoxModule, TextAreaModule],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Contact {
  private readonly fb = inject(FormBuilder);
  private readonly contact = inject(ContactService);
  private readonly messages = inject(NotificationService);

  protected readonly submitting = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    message: ['', [Validators.required, Validators.minLength(10)]],
  });

  /** Une erreur ne s'affiche qu'une fois le champ touché (`markAllAsTouched` couvre la soumission). */
  protected showError(field: 'name' | 'email' | 'message'): boolean {
    const control = this.form.controls[field];
    return control.invalid && control.touched;
  }

  /** Attributs natifs (id, aria-*) à reporter sur l'`<input>`/`<textarea>` réel de Syncfusion. */
  protected fieldAttrs(field: 'name' | 'email' | 'message'): Record<string, string> {
    const hasError = this.showError(field);
    const attrs: Record<string, string> = {
      id: field,
      'aria-invalid': String(hasError),
    };
    if (hasError) {
      attrs['aria-describedby'] = `${field}-error`;
    }
    return attrs;
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.contact.send(this.form.getRawValue()).subscribe({
      next: () => {
        this.messages.add({
          severity: 'success',
          summary: 'Message envoyé',
          detail: 'Nous vous répondrons dès que possible.',
        });
        this.form.reset();
        this.submitting.set(false);
      },
      // Le détail de l'erreur est déjà affiché par errorInterceptor.
      error: () => this.submitting.set(false),
    });
  }
}
