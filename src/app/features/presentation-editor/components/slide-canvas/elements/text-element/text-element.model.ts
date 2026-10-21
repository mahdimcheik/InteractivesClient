import { SLIDE_DEFAULT_TEXT_COLOR, SlideFont } from '@core/utilities/models/slide-style';

import {
  TextAlign,
  TextAppearance,
  TextRole,
  defaultTextAppearance,
} from '../shared/text-appearance';

/**
 * Les champs ajoutés après coup ont une valeur par défaut : la fusion avec
 * {@link TEXT_DEFAULT_CONFIG} garde valides les éléments créés avant. `fontSize` et `bold` à
 * `null` suivent le rôle (un titre est plus grand et en gras).
 */
export interface TextElementConfig {
  content: string;
  role: TextRole;
  font: SlideFont;
  fontSize: number | null;
  color: string;
  bold: boolean | null;
  italic: boolean;
  underline: boolean;
  align: TextAlign;
}

export const TEXT_DEFAULT_CONFIG: TextElementConfig = {
  content: '',
  role: 'body',
  font: 'sans',
  fontSize: null,
  color: SLIDE_DEFAULT_TEXT_COLOR,
  bold: null,
  italic: false,
  underline: false,
  align: 'left',
};

export function textAppearance(config: TextElementConfig): TextAppearance {
  const byRole = defaultTextAppearance(config.role);
  return {
    font: config.font,
    fontSize: config.fontSize ?? byRole.fontSize,
    color: config.color,
    bold: config.bold ?? byRole.bold,
    italic: config.italic,
    underline: config.underline,
    align: config.align,
  };
}
