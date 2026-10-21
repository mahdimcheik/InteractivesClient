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
  readonly presentationTitle = input('');
  readonly canPresent = input(false);
  readonly rename = output<void>();
  readonly present = output<void>();
}
