import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { ElementConfigEditor } from '@core/utilities/models/slide-element-base';
import { SLIDE_FONTS, SlideFont } from '@core/utilities/models/slide-style';

import { MAX_FONT_SIZE, MIN_FONT_SIZE, TextAlign } from '../shared/text-appearance';
import { TEXT_DEFAULT_CONFIG, TextElementConfig, textAppearance } from './text-element.model';

const ALIGNMENTS: readonly { value: TextAlign; label: string; icon: string }[] = [
  { value: 'left', label: 'Aligner à gauche', icon: 'pi-align-left' },
  { value: 'center', label: 'Centrer', icon: 'pi-align-center' },
  { value: 'right', label: 'Aligner à droite', icon: 'pi-align-right' },
  { value: 'justify', label: 'Justifier', icon: 'pi-align-justify' },
];

/** Mise en forme d'un élément texte. */
@Component({
  selector: 'app-text-element-panel',
  template: `
    <div class="field">
      <label class="field-label" for="prop-text-font">Police</label>
      <select
        id="prop-text-font"
        [value]="appearance().font"
        (change)="saveConfig({ font: $any($event.target).value })"
      >
        @for (font of fonts; track font.key) {
          <option [value]="font.key">{{ font.label }}</option>
        }
      </select>
    </div>

    <div class="field-row">
      <div class="field">
        <label class="field-label" for="prop-text-size">Taille</label>
        <input
          id="prop-text-size"
          type="number"
          [min]="minFontSize"
          [max]="maxFontSize"
          [value]="appearance().fontSize"
          (change)="saveFontSize($any($event.target).valueAsNumber)"
        />
      </div>
      <div class="field">
        <label class="field-label" for="prop-text-color">Couleur</label>
        <input
          id="prop-text-color"
          type="color"
          [value]="appearance().color"
          (change)="saveConfig({ color: $any($event.target).value })"
        />
      </div>
    </div>

    <div class="field" role="group" aria-labelledby="prop-text-style-label">
      <span id="prop-text-style-label" class="field-label">Style</span>
      <div class="toggle-group">
        <button
          type="button"
          class="toggle"
          aria-label="Gras"
          [attr.aria-pressed]="appearance().bold"
          (click)="saveConfig({ bold: !appearance().bold })"
        >
          <strong aria-hidden="true">G</strong>
        </button>
        <button
          type="button"
          class="toggle"
          aria-label="Italique"
          [attr.aria-pressed]="appearance().italic"
          (click)="saveConfig({ italic: !appearance().italic })"
        >
          <em aria-hidden="true">I</em>
        </button>
        <button
          type="button"
          class="toggle"
          aria-label="Souligné"
          [attr.aria-pressed]="appearance().underline"
          (click)="saveConfig({ underline: !appearance().underline })"
        >
          <u aria-hidden="true">S</u>
        </button>
      </div>
    </div>

    <div class="field" role="group" aria-labelledby="prop-text-align-label">
      <span id="prop-text-align-label" class="field-label">Alignement</span>
      <div class="toggle-group">
        @for (alignment of alignments; track alignment.value) {
          <button
            type="button"
            class="toggle"
            [attr.aria-label]="alignment.label"
            [attr.aria-pressed]="appearance().align === alignment.value"
            (click)="saveConfig({ align: alignment.value })"
          >
            <i class="pi" [class]="alignment.icon" aria-hidden="true"></i>
          </button>
        }
      </div>
    </div>
  `,
  styleUrl: '../shared/panel-fields.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextElementPanel extends ElementConfigEditor<TextElementConfig> {
  protected readonly defaultConfig = TEXT_DEFAULT_CONFIG;

  protected readonly appearance = computed(() => textAppearance(this.config()));
  protected readonly fonts = (Object.keys(SLIDE_FONTS) as SlideFont[]).map((key) => ({
    key,
    label: SLIDE_FONTS[key].label,
  }));
  protected readonly alignments = ALIGNMENTS;
  protected readonly minFontSize = MIN_FONT_SIZE;
  protected readonly maxFontSize = MAX_FONT_SIZE;

  protected saveFontSize(value: number): void {
    if (Number.isFinite(value)) {
      this.saveConfig({
        fontSize: Math.round(Math.min(Math.max(value, MIN_FONT_SIZE), MAX_FONT_SIZE)),
      });
    }
  }
}
