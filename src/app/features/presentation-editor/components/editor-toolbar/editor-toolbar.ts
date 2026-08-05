import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-editor-toolbar',
  templateUrl: './editor-toolbar.html',
  styleUrl: './editor-toolbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorToolbar {
  protected readonly fonts = ['Inter', 'Roboto', 'Open Sans'];
}
