import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ElementConfigEditor } from '@core/utilities/models/slide-element-base';

import { IMAGE_DEFAULT_CONFIG, IMAGE_FITS, ImageConfig } from './image-element.model';

/** Ajustement d'une image dans son cadre. */
@Component({
  selector: 'app-image-element-panel',
  template: `
    <div class="field">
      <label class="field-label" for="prop-image-fit">Ajustement</label>
      <select
        id="prop-image-fit"
        [value]="config().fit"
        (change)="saveConfig({ fit: $any($event.target).value })"
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
export class ImageElementPanel extends ElementConfigEditor<ImageConfig> {
  protected readonly defaultConfig = IMAGE_DEFAULT_CONFIG;
  protected readonly fits = IMAGE_FITS;
}
