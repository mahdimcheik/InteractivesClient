import { Type } from '@angular/core';
import { ElementTypeEnum } from '@client';

import { TextElement } from './text-element/text-element';
import { TextElementConfig } from './text-element/text-element.model';

export const ELEMENT_COMPONENTS: Partial<Record<ElementTypeEnum, Type<unknown>>> = {
  [ElementTypeEnum.Text]: TextElement,
};

/** Valeurs par défaut utilisées lors de la création d'un élément par glisser-déposer. */
export const ELEMENT_DEFAULTS: Partial<
  Record<ElementTypeEnum, { width: number; height: number; configuration: string }>
> = {
  [ElementTypeEnum.Text]: {
    width: 320,
    height: 80,
    configuration: JSON.stringify({ text: 'Nouveau texte' } satisfies TextElementConfig),
  },
};
