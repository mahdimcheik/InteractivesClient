import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SlideElementBase } from '@core/utilities/models/slide-element-base';

import { ImageConfig } from '../image-element/image-element.model';
import { EditableText } from '../shared/editable-text';
import { defaultTextAppearance } from '../shared/text-appearance';
import { ImageView } from '../shared/image-view';
import {
  TEXT_IMAGE_TITLE_DEFAULT_CONFIG,
  TextImageTitleConfig,
} from './text-image-title-element.model';

@Component({
  selector: 'app-text-image-title-element',
  imports: [EditableText, ImageView],
  template: `
    <div class="layout" [class.image-left]="config().imagePosition === 'left'">
      <app-editable-text
        class="title"
        [text]="config().title"
        [editable]="isEditable()"
        [heading]="true"
        [appearance]="titleAppearance"
        label="Titre"
        placeholder="Titre"
        (committed)="saveConfig({ title: $event })"
      />
      <app-editable-text
        class="body"
        [text]="config().body"
        [editable]="isEditable()"
        label="Texte"
        placeholder="Texte"
        [appearance]="bodyAppearance"
        (committed)="saveConfig({ body: $event })"
      />
      <app-image-view
        class="image"
        [image]="config().image"
        [editable]="isEditable()"
        [presentationId]="presentationId()"
        (picked)="saveImage({ key: $event.key ?? null, url: $event.url ?? null })"
        (altChanged)="saveImage({ alt: $event })"
      />
    </div>
  `,
  styleUrl: './text-image-title-element.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextImageTitleElement extends SlideElementBase<TextImageTitleConfig> {
  protected readonly defaultConfig = TEXT_IMAGE_TITLE_DEFAULT_CONFIG;
  protected readonly titleAppearance = defaultTextAppearance('title');
  protected readonly bodyAppearance = defaultTextAppearance('body');

  protected saveImage(patch: Partial<ImageConfig>): void {
    this.saveConfig({ image: { ...this.config().image, ...patch } });
  }
}
