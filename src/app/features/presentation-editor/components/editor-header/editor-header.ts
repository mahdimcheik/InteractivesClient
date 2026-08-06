import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { PresentationMode } from '@app/core/utilities/models/enumerators';
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
  mode = model.required<PresentationMode>();
  label = computed(() => {
    return this.mode() === PresentationMode.Edit ? 'Mode édition' : 'Mode présentation';
  });

  toggleMode() {
    this.mode.set(
      this.mode() === PresentationMode.Edit ? PresentationMode.Presentation : PresentationMode.Edit,
    );
  }
}
