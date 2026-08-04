import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from '@syncfusion/ej2-angular-buttons';

@Component({
  selector: 'app-home',
  imports: [RouterLink, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Bienvenue sur le boilerplate</h1>
    <p>
      Cette page est rendue côté serveur puis hydratée. Remplacez ce contenu par la page d'accueil
      du projet.
    </p>
    <p>
      <a routerLink="/contact" ejs-button>Nous contacter</a>
    </p>
  `,
})
export class Home {}
