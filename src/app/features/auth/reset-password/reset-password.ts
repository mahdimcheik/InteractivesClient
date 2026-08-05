import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NotificationService } from '@core/utilities/services/notification.service';

import { ConfigurableFormComponent } from '@app/core/components/configurable-form/configurable-form.component';
import { Structure } from '@app/core/components/configurable-form/related-models';
import { AuthMirrorService } from '@app/core/utilities/services/auth-mirror.service';
import { passwordValidator } from '@app/core/utilities/validators/confirmPasswordValidator';

const SECTION_ID = 'nouveau-mot-de-passe';

interface ResetPasswordFormValue {
  password: string;
  passwordConfirmation: string;
}

@Component({
  selector: 'app-reset-password',
  imports: [RouterLink, ConfigurableFormComponent],
  templateUrl: './reset-password.html',
  styleUrl: '../auth-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPassword {
  private readonly auth = inject(AuthMirrorService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly messages = inject(NotificationService);

  private readonly userId = this.route.snapshot.queryParamMap.get('userId') ?? '';
  private readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';

  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);
  protected readonly linkInvalid = !this.userId || !this.token;

  protected readonly structure: Structure = {
    id: 'reinitialiser-mot-de-passe',
    name: 'reinitialiser-mot-de-passe',
    label: 'Réinitialiser le mot de passe',
    submitButtonLabel: 'Réinitialiser le mot de passe',
    hideCancelButton: true,
    sections: [
      {
        id: SECTION_ID,
        name: SECTION_ID,
        label: 'Nouveau mot de passe',
        groupValidators: [passwordValidator('password', 'passwordConfirmation')],
        fields: [
          {
            id: 'password',
            name: 'password',
            label: 'Nouveau mot de passe',
            type: 'password',
            placeholder: '8 caractères, majuscule, chiffre et caractère spécial',
            required: true,
            fullWidth: true,
            order: 1,
          },
          {
            id: 'passwordConfirmation',
            name: 'passwordConfirmation',
            label: 'Confirmation du mot de passe',
            type: 'password',
            required: true,
            fullWidth: true,
            order: 2,
          },
        ],
      },
    ],
  };

  protected submit(form: FormGroup): void {
    if (this.submitting()) {
      return;
    }

    const value = (form.getRawValue() as Record<string, ResetPasswordFormValue>)[SECTION_ID];

    this.submitting.set(true);
    this.serverError.set(null);

    this.auth
      .resetPassword({
        userId: this.userId,
        token: this.token,
        password: value.password,
        passwordConfirmation: value.passwordConfirmation,
      })
      .subscribe({
        next: () => {
          this.messages.add({
            severity: 'success',
            summary: 'Mot de passe mis à jour',
            detail: 'Vous pouvez maintenant vous connecter.',
          });
          void this.router.navigateByUrl('/connexion');
        },
        error: (error: { error?: { message?: string } }) => {
          this.serverError.set(
            error?.error?.message ?? 'Réinitialisation impossible. Réessayez.',
          );
          this.submitting.set(false);
        },
      });
  }
}
