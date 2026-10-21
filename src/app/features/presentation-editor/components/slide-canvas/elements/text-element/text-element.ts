import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { SlideElementBase } from '@core/utilities/models/slide-element-base';

import { EditableText } from '../shared/editable-text';
import { TEXT_DEFAULT_CONFIG, TextElementConfig } from './text-element.model';

@Component({
  selector: 'app-text-element',
  imports: [EditableText],
  template: `
    <app-editable-text
      [text]="config().content"
      [editable]="isEditable()"
      [heading]="isTitle()"
      [label]="isTitle() ? 'Titre' : 'Texte'"
      [placeholder]="isTitle() ? 'Titre' : 'Texte'"
      (committed)="saveConfig({ content: $event })"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextElement extends SlideElementBase<TextElementConfig> {
  protected readonly defaultConfig = TEXT_DEFAULT_CONFIG;

  protected readonly isTitle = computed(() => this.config().role === 'title');
}
