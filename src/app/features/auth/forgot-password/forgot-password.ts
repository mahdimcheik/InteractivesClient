import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ConfigurableFormComponent } from '@app/core/components/configurable-form/configurable-form.component';
import { Structure } from '@app/core/components/configurable-form/related-models';
import { AuthMirrorService } from '@app/core/utilities/services/auth-mirror.service';

const SECTION_ID = 'demande';

interface ForgotPasswordFormValue {
  email: string;
}

@Component({
  selector: 'app-forgot-password',
  imports: [RouterLink, ConfigurableFormComponent],
  templateUrl: './forgot-password.html',
  styleUrl: '../auth-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPassword {
  private readonly auth = inject(AuthMirrorService);

  protected readonly submitting = signal(false);
  protected readonly sent = signal(false);

  protected readonly structure: Structure = {
    id: 'mot-de-passe-oublie',
    name: 'mot-de-passe-oublie',
    label: 'Mot de passe oublié',
    submitButtonLabel: 'Envoyer le lien',
    hideCancelButton: true,
    sections: [
      {
        id: SECTION_ID,
        name: SECTION_ID,
        label: 'Adresse e-mail',
        fields: [
          {
            id: 'email',
            name: 'email',
            label: 'Adresse e-mail',
            type: 'email',
            placeholder: 'vous@exemple.com',
            required: true,
            fullWidth: true,
            order: 1,
            validation: [Validators.email],
          },
        ],
      },
    ],
  };

  protected submit(form: FormGroup): void {
    if (this.submitting()) {
      return;
    }

    const value = (form.getRawValue() as Record<string, ForgotPasswordFormValue>)[SECTION_ID];

    this.submitting.set(true);

    // On affiche toujours le même message de confirmation, succès ou échec, pour ne pas
    // révéler si l'adresse correspond à un compte existant.
    this.auth.forgotPassword({ email: value.email }).subscribe({
      next: () => this.sent.set(true),
      error: () => this.sent.set(true),
    });
  }
}
