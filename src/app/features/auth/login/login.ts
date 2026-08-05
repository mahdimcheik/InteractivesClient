import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ConfigurableFormComponent } from '@app/core/components/configurable-form/configurable-form.component';
import { Structure } from '@app/core/components/configurable-form/related-models';
import { AuthMirrorService } from '@app/core/utilities/services/auth-mirror.service';

/** Identifiant de la section du formulaire : le `FormGroup` émis est imbriqué dessous. */
const SECTION_ID = 'identifiants';

interface LoginFormValue {
  email: string;
  password: string;
}

@Component({
  selector: 'app-login',
  imports: [RouterLink, ConfigurableFormComponent],
  templateUrl: './login.html',
  styleUrl: '../auth-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly auth = inject(AuthMirrorService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected readonly structure: Structure = {
    id: 'connexion',
    name: 'connexion',
    label: 'Connexion',
    submitButtonLabel: 'Se connecter',
    hideCancelButton: true,
    sections: [
      {
        id: SECTION_ID,
        name: SECTION_ID,
        label: 'Vos identifiants',
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

    const value = (form.getRawValue() as Record<string, LoginFormValue>)[SECTION_ID];

    this.submitting.set(true);
    this.serverError.set(null);

    this.auth.login({ email: value.email, password: value.password }).subscribe({
      next: (session) => {
        if (!session?.token) {
          this.serverError.set('Connexion impossible. Réessayez.');
          this.submitting.set(false);
          return;
        }

        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
        void this.router.navigateByUrl(returnUrl);
      },
      error: (error: { error?: { message?: string } }) => {
        this.serverError.set(error?.error?.message ?? 'Connexion impossible. Réessayez.');
        this.submitting.set(false);
      },
    });
  }
}
