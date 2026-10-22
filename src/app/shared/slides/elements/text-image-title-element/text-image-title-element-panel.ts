import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ElementConfigEditor } from '@core/utilities/models/slide-element-base';

import { IMAGE_FITS, ImageFit } from '../image-element/image-element.model';
import {
  ImagePosition,
  TEXT_IMAGE_TITLE_DEFAULT_CONFIG,
  TextImageTitleConfig,
} from './text-image-title-element.model';

/** Côté de l'image et ajustement, pour l'élément Titre + texte + image. */
@Component({
  selector: 'app-text-image-title-element-panel',
  template: `
    <div class="field" role="group" aria-labelledby="prop-tit-position-label">
      <span id="prop-tit-position-label" class="field-label">Position de l'image</span>
      <div class="toggle-group">
        @for (position of positions; track position.value) {
          <button
            type="button"
            class="toggle"
            [attr.aria-pressed]="config().imagePosition === position.value"
            (click)="saveConfig({ imagePosition: position.value })"
          >
            {{ position.label }}
          </button>
        }
      </div>
    </div>

    <div class="field">
      <label class="field-label" for="prop-tit-fit">Ajustement de l'image</label>
      <select
        id="prop-tit-fit"
        [value]="config().image.fit"
        (change)="saveFit($any($event.target).value)"
      >
        @for (fit of fits; track fit.value) {
          <option [value]="fit.value">{{ fit.label }}</option>
        }
      </select>
    </div>
  `,
  styleUrl: '../shared/panel-fields.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextImageTitleElementPanel extends ElementConfigEditor<TextImageTitleConfig> {
  protected readonly defaultConfig = TEXT_IMAGE_TITLE_DEFAULT_CONFIG;
  protected readonly fits = IMAGE_FITS;
  protected readonly positions: readonly { value: ImagePosition; label: string }[] = [
    { value: 'left', label: 'À gauche' },
    { value: 'right', label: 'À droite' },
  ];

  protected saveFit(fit: ImageFit): void {
    this.saveConfig({ image: { ...this.config().image, fit } });
  }
}
