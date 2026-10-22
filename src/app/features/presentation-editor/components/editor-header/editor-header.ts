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
  /** Séance en direct en cours, ou `null`. */
  readonly live = input<{ code: string; participantCount: number } | null>(null);
  readonly startingLive = input(false);
  readonly rename = output<void>();
  readonly present = output<void>();
  readonly goLive = output<void>();
  readonly endLive = output<void>();
}
