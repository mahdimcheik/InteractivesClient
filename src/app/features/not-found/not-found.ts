import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from '@syncfusion/ej2-angular-buttons';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'app-container' },
  styles: `
    :host {
      display: block;
      padding-block: 4rem;
      text-align: center;
    }
  `,
  template: `
    <h1>Page introuvable</h1>
    <p>La page demandée n'existe pas ou a été déplacée.</p>
    <p><a routerLink="/" ejs-button>Retour à l'accueil</a></p>
  `,
})
export class NotFound {}
