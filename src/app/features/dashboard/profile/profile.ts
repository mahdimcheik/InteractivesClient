import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from '@syncfusion/ej2-angular-buttons';
import { TextBoxModule } from '@syncfusion/ej2-angular-inputs';
import { NotificationService } from '@core/utilities/services/notification.service';

import { Store } from '@core/utilities/services/store';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, ButtonModule, TextBoxModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    @layer app {
      form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        max-width: 28rem;
        margin-top: 1.5rem;
      }

      .field {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
      }

      label {
        font-weight: 600;
      }

      .field-error {
        margin: 0;
        font-size: 0.875rem;
        color: var(--app-danger-color);
      }

      button {
        align-self: flex-start;
      }
    }
  `,
  template: `
    <h1>Profil</h1>
    <p>Vos informations personnelles.</p>

    <form [formGroup]="form" (ngSubmit)="save()" novalidate>
      <div class="field">
        <label for="firstName">Prénom</label>
        <ejs-textbox
          type="text"
          formControlName="firstName"
          autocomplete="given-name"
          [htmlAttributes]="fieldAttrs('firstName')"
        />
        @if (showError('firstName')) {
          <p id="firstName-error" class="field-error" role="alert">Le prénom est obligatoire.</p>
        }
      </div>

      <div class="field">
        <label for="lastName">Nom</label>
        <ejs-textbox
          type="text"
          formControlName="lastName"
          autocomplete="family-name"
          [htmlAttributes]="fieldAttrs('lastName')"
        />
        @if (showError('lastName')) {
          <p id="lastName-error" class="field-error" role="alert">Le nom est obligatoire.</p>
        }
      </div>

      <div class="field">
        <label for="email">Adresse e-mail</label>
        <ejs-textbox
          type="email"
          formControlName="email"
          autocomplete="email"
          [htmlAttributes]="fieldAttrs('email')"
        />
        @if (showError('email')) {
          <p id="email-error" class="field-error" role="alert">
            Indiquez une adresse e-mail valide.
          </p>
        }
      </div>

      <button type="submit" ejs-button [disabled]="saving()">
        {{ saving() ? 'Enregistrement…' : 'Enregistrer' }}
      </button>
    </form>
  `,
})
export class Profile {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly messages = inject(NotificationService);

  protected readonly saving = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
  });

  constructor() {
    // Le profil peut arriver après le premier rendu (restauration de session).
    effect(() => {
      const user = this.store.user();
      if (user) {
        this.form.reset({
          firstName: user.firstName ?? '',
          lastName: user.lastName ?? '',
          email: user.email ?? '',
        });
      }
    });
  }

  protected showError(field: 'firstName' | 'lastName' | 'email'): boolean {
    const control = this.form.controls[field];
    return control.invalid && control.touched;
  }

  /** Attributs natifs (id, aria-*) à reporter sur l'`<input>` réel de Syncfusion. */
  protected fieldAttrs(field: 'firstName' | 'lastName' | 'email'): Record<string, string> {
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

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // TODO: brancher sur l'endpoint de mise à jour du profil du projet.
    this.saving.set(true);
    setTimeout(() => {
      this.saving.set(false);
      this.messages.add({
        severity: 'success',
        summary: 'Profil enregistré',
        detail: 'Sauvegarde simulée : branchez votre API ici.',
      });
    }, 400);
  }
}
