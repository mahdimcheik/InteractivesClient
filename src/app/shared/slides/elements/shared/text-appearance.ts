import { SLIDE_DEFAULT_TEXT_COLOR, SlideFont } from '@core/utilities/models/slide-style';

export type TextRole = 'title' | 'body';
export type TextAlign = 'left' | 'center' | 'right' | 'justify';

/** Mise en forme résolue d'un bloc de texte ; tailles en unités logiques de diapositive. */
export interface TextAppearance {
  font: SlideFont;
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: TextAlign;
}

export const MIN_FONT_SIZE = 8;
export const MAX_FONT_SIZE = 200;

export function defaultTextAppearance(role: TextRole): TextAppearance {
  return {
    font: 'sans',
    fontSize: role === 'title' ? 64 : 32,
    color: SLIDE_DEFAULT_TEXT_COLOR,
    bold: role === 'title',
    italic: false,
    underline: false,
    align: 'left',
  };
}
