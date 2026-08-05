import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NotificationService } from '@core/utilities/services/notification.service';

import { RoleEnum } from '@client';
import { ConfigurableFormComponent } from '@app/core/components/configurable-form/configurable-form.component';
import { Structure } from '@app/core/components/configurable-form/related-models';
import { AuthMirrorService } from '@app/core/utilities/services/auth-mirror.service';
import {
  ageValidator,
  passwordValidator,
} from '@app/core/utilities/validators/confirmPasswordValidator';

const IDENTITY_SECTION = 'identite';
const ACCOUNT_SECTION = 'compte';
const CONSENT_SECTION = 'consentements';

interface IdentityValue {
  firstName: string;
  lastName: string;
  dateOfBirth: string | Date;
  role: RoleEnum;
}

interface AccountValue {
  email: string;
  password: string;
  passwordConfirmation: string;
}

interface ConsentValue {
  dataProcessingConsent: boolean;
  privacyPolicyConsent: boolean;
}

@Component({
  selector: 'app-register',
  imports: [RouterLink, ConfigurableFormComponent],
  templateUrl: './register.html',
  styleUrl: '../auth-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Register {
  private readonly auth = inject(AuthMirrorService);
  private readonly router = inject(Router);
  private readonly messages = inject(NotificationService);

  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected readonly structure: Structure = {
    id: 'inscription',
    name: 'inscription',
    label: 'Créer un compte',
    submitButtonLabel: 'Créer mon compte',
    hideCancelButton: true,
    sections: [
      {
        id: IDENTITY_SECTION,
        name: IDENTITY_SECTION,
        label: 'Votre identité',
        order: 1,
        fields: [
          {
            id: 'role',
            name: 'label',
            label: 'Je suis...',
            type: 'select',
            required: true,
            fullWidth: true,
            displayKey: 'label',
            compareKey: 'label',
            order: 1,
            value: RoleEnum.Client,
            options: [
              { label: 'Client', value: RoleEnum.Client },
              { label: 'Professionnel', value: RoleEnum.Professionnal },
            ],
          },
          {
            id: 'firstName',
            name: 'firstName',
            label: 'Prénom',
            type: 'text',
            required: true,
            order: 2,
          },
          {
            id: 'lastName',
            name: 'lastName',
            label: 'Nom',
            type: 'text',
            required: true,
            order: 3,
          },
          {
            id: 'dateOfBirth',
            name: 'dateOfBirth',
            label: 'Date de naissance',
            type: 'date',
            fullWidth: true,
            order: 4,
            validation: [ageValidator()],
          },
        ],
      },
      {
        id: ACCOUNT_SECTION,
        name: ACCOUNT_SECTION,
        label: 'Votre compte',
        order: 2,
        // Vérifie la robustesse du mot de passe et son doublon (clés `weakPassword`
        // et `passwordDifference` du dictionnaire `errorMessages`).
        groupValidators: [passwordValidator('password', 'passwordConfirmation')],
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
          {
            id: 'password',
            name: 'password',
            label: 'Mot de passe',
            type: 'password',
            placeholder: '8 caractères, majuscule, chiffre et caractère spécial',
            required: true,
            order: 2,
          },
          {
            id: 'passwordConfirmation',
            name: 'passwordConfirmation',
            label: 'Confirmation du mot de passe',
            type: 'password',
            required: true,
            order: 3,
          },
        ],
      },
      {
        id: CONSENT_SECTION,
        name: CONSENT_SECTION,
        label: 'Consentements',
        order: 3,
        fields: [
          {
            id: 'dataProcessingConsent',
            name: 'dataProcessingConsent',
            label: 'Traitement des données',
            placeholder: "J'accepte le traitement de mes données personnelles.",
            type: 'checkbox',
            required: true,
            fullWidth: true,
            order: 1,
          },
          {
            id: 'privacyPolicyConsent',
            name: 'privacyPolicyConsent',
            label: 'Politique de confidentialité',
            placeholder: "J'ai lu et j'accepte la politique de confidentialité.",
            type: 'checkbox',
            required: true,
            fullWidth: true,
            order: 2,
          },
        ],
      },
    ],
  };

  protected submit(form: FormGroup): void {
    // Le bouton de `bp-configurable-form` ne se désactive pas : on garde le double clic ici.
    if (this.submitting()) {
      return;
    }

    const value = form.getRawValue() as Record<string, IdentityValue & AccountValue & ConsentValue>;
    const identity = value[IDENTITY_SECTION] as IdentityValue;
    const account = value[ACCOUNT_SECTION] as AccountValue;
    const consents = value[CONSENT_SECTION] as ConsentValue;

    this.submitting.set(true);
    this.serverError.set(null);

    this.auth
      .register({
        firstName: identity.firstName,
        lastName: identity.lastName,
        dateOfBirth: identity.dateOfBirth ? new Date(identity.dateOfBirth) : null,
        email: account.email,
        password: account.password,
        role: identity.role,
        dataProcessingConsent: consents.dataProcessingConsent,
        privacyPolicyConsent: consents.privacyPolicyConsent,
      })
      .subscribe({
        // L'API ne renvoie pas de token à l'inscription : on redirige vers la connexion.
        next: () => {
          this.messages.add({
            severity: 'success',
            summary: 'Compte créé',
            detail: 'Vous pouvez maintenant vous connecter.',
          });
          void this.router.navigateByUrl('/connexion');
        },
        error: (error: { error?: { message?: string } }) => {
          this.serverError.set(error?.error?.message ?? 'Inscription impossible. Réessayez.');
          this.submitting.set(false);
        },
      });
  }
}
