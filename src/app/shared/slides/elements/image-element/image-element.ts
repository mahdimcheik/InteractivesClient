import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SlideElementBase } from '@core/utilities/models/slide-element-base';

import { ImageView } from '../shared/image-view';
import { IMAGE_DEFAULT_CONFIG, ImageConfig } from './image-element.model';

@Component({
  selector: 'app-image-element',
  imports: [ImageView],
  template: `
    <app-image-view
      [image]="config()"
      [editable]="isEditable()"
      [presentationId]="presentationId()"
      (picked)="saveConfig({ key: $event.key ?? null, url: $event.url ?? null })"
      (altChanged)="saveConfig({ alt: $event })"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageElement extends SlideElementBase<ImageConfig> {
  protected readonly defaultConfig = IMAGE_DEFAULT_CONFIG;
}
