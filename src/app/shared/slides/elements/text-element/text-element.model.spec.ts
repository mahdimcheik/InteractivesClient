import { parseElementConfig } from '@core/utilities/models/slide-element-base';
import { SLIDE_DEFAULT_TEXT_COLOR } from '@core/utilities/models/slide-style';
import { describe, expect, it } from 'vitest';

import { TEXT_DEFAULT_CONFIG, textAppearance } from './text-element.model';

describe('textAppearance', () => {
  it('donne une mise en forme complète à un élément créé avant la mise en forme', () => {
    const config = parseElementConfig('{"content":"Bonjour","role":"title"}', TEXT_DEFAULT_CONFIG);

    expect(textAppearance(config)).toEqual({
      font: 'sans',
      fontSize: 64,
      color: SLIDE_DEFAULT_TEXT_COLOR,
      bold: true,
      italic: false,
      underline: false,
      align: 'left',
    });
  });

  it('respecte les choix explicites plutôt que le rôle', () => {
    const config = { ...TEXT_DEFAULT_CONFIG, role: 'title' as const, fontSize: 40, bold: false };

    expect(textAppearance(config)).toEqual(expect.objectContaining({ fontSize: 40, bold: false }));
  });
});
