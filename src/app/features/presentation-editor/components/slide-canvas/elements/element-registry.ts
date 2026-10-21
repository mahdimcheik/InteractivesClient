import { Type } from '@angular/core';
import { ElementTypeEnum } from '@client';
import { SlideElementBase } from '@core/utilities/models/slide-element-base';

import { ImageElement } from './image-element/image-element';
import { IMAGE_DEFAULT_CONFIG, ImageConfig } from './image-element/image-element.model';
import { TextElement } from './text-element/text-element';
import { TEXT_DEFAULT_CONFIG, TextElementConfig } from './text-element/text-element.model';

/** Composant de rendu par type API. Un type peut servir plusieurs presets (Titre/Texte → `Text`). */
export const ELEMENT_COMPONENTS: Partial<Record<ElementTypeEnum, Type<SlideElementBase<object>>>> =
  {
    [ElementTypeEnum.Text]: TextElement,
    [ElementTypeEnum.Image]: ImageElement,
  };

/** Entrée de la palette de l'éditeur : ce qui est créé quand on la glisse sur la diapositive. */
export interface ElementPreset {
  id: string;
  label: string;
  /** Classe primeicons. */
  icon: string;
  type: ElementTypeEnum;
  size: { width: number; height: number };
  configuration: string;
}

export const ELEMENT_PRESETS: readonly ElementPreset[] = [
  {
    id: 'title',
    label: 'Titre',
    icon: 'pi-heading',
    type: ElementTypeEnum.Text,
    size: { width: 560, height: 80 },
    configuration: JSON.stringify({
      ...TEXT_DEFAULT_CONFIG,
      content: 'Titre',
      role: 'title',
    } satisfies TextElementConfig),
  },
  {
    id: 'text',
    label: 'Zone de texte',
    icon: 'pi-align-left',
    type: ElementTypeEnum.Text,
    size: { width: 320, height: 120 },
    configuration: JSON.stringify({
      ...TEXT_DEFAULT_CONFIG,
      content: 'Nouveau texte',
    } satisfies TextElementConfig),
  },
  {
    id: 'image',
    label: 'Image',
    icon: 'pi-image',
    type: ElementTypeEnum.Image,
    size: { width: 320, height: 200 },
    configuration: JSON.stringify(IMAGE_DEFAULT_CONFIG satisfies ImageConfig),
  },
];

export function findElementPreset(id: string): ElementPreset | undefined {
  return ELEMENT_PRESETS.find((preset) => preset.id === id);
}
