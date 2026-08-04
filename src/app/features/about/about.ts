import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-about',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>À propos</h1>
    <p>
      Page de présentation, prérendue au build pour le référencement. Remplacez ce contenu par la
      présentation du projet.
    </p>
  `,
})
export class About {}
