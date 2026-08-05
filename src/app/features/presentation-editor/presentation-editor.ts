import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { EditorHeader } from './components/editor-header/editor-header';
import { EditorToolbar } from './components/editor-toolbar/editor-toolbar';
import { PropertiesPanel } from './components/properties-panel/properties-panel';
import { SlideCanvas } from './components/slide-canvas/slide-canvas';
import { SlidePanel } from './components/slide-panel/slide-panel';

@Component({
  selector: 'app-presentation-editor',
  imports: [EditorHeader, EditorToolbar, SlidePanel, SlideCanvas, PropertiesPanel],
  templateUrl: './presentation-editor.html',
  styleUrl: './presentation-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PresentationEditor {
  protected readonly selectedSlideIndex = signal(0);
}
