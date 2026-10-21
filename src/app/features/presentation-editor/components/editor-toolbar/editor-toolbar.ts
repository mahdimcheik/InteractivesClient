import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ELEMENT_PRESETS } from '../slide-canvas/elements/element-registry';

@Component({
  selector: 'app-editor-toolbar',
  imports: [CdkDropList, CdkDrag],
  templateUrl: './editor-toolbar.html',
  styleUrl: './editor-toolbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorToolbar {
  protected readonly fonts = ['Inter', 'Roboto', 'Open Sans'];
  protected readonly presets = ELEMENT_PRESETS;

  /** La palette est une source de glisser-déposer pure ; rien ne peut y être déposé. */
  protected readonly blockDrop = () => false;
}
