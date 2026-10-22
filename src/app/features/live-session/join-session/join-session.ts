import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

/** Saisie du code d'une séance, pour qui n'a pas reçu le lien. */
@Component({
  selector: 'app-join-session',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="join-page">
      <form class="join-card" (ngSubmit)="submit()" novalidate>
        <h1>Rejoindre une séance</h1>
        <p class="join-help">Saisissez le code affiché par votre enseignant.</p>

        <label for="session-code">Code de la séance</label>
        <input
          id="session-code"
          type="text"
          autocomplete="off"
          autocapitalize="characters"
          spellcheck="false"
          maxlength="6"
          [formControl]="code"
          [attr.aria-invalid]="showError()"
          [attr.aria-describedby]="showError() ? 'session-code-error' : null"
        />
        @if (showError()) {
          <p id="session-code-error" class="join-error" role="alert">
            Le code compte 6 caractères.
          </p>
        }

        <button type="submit">Rejoindre</button>
        <a routerLink="/dashboard" class="join-back">Retour au tableau de bord</a>
      </form>
    </main>
  `,
  styleUrl: './join-session.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JoinSession {
  private readonly router = inject(Router);

  protected readonly code = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/^[A-Za-z0-9]{6}$/)],
  });
  protected readonly showError = signal(false);

  protected submit(): void {
    const code = this.code.value.trim().toUpperCase();
    this.code.setValue(code);
    if (this.code.invalid) {
      this.showError.set(true);
      return;
    }
    void this.router.navigate(['/seance', code]);
  }
}
