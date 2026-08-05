import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from '@syncfusion/ej2-angular-buttons';

@Component({
  selector: 'app-editor-header',
  imports: [RouterLink, ButtonModule],
  templateUrl: './editor-header.html',
  styleUrl: './editor-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorHeader {
  readonly presentationTitle = input('Biologie 101 : Structure de la cellule');
  readonly rename = output<void>();
}
