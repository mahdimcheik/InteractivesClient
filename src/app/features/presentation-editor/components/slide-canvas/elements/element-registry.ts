import { Type } from '@angular/core';
import { ElementTypeEnum } from '@client';
import { SlideElementBase } from '@core/utilities/models/slide-element-base';

import { ImageElement } from './image-element/image-element';
import { IMAGE_DEFAULT_CONFIG, ImageConfig } from './image-element/image-element.model';
import { TextElement } from './text-element/text-element';
import { TEXT_DEFAULT_CONFIG, TextElementConfig } from './text-element/text-element.model';
import { TextImageTitleElement } from './text-image-title-element/text-image-title-element';
import {
  TEXT_IMAGE_TITLE_DEFAULT_CONFIG,
  TextImageTitleConfig,
} from './text-image-title-element/text-image-title-element.model';

/** Composant de rendu par type API. Un type peut servir plusieurs presets (Titre/Texte → `Text`). */
export const ELEMENT_COMPONENTS: Partial<Record<ElementTypeEnum, Type<SlideElementBase<object>>>> =
  {
    [ElementTypeEnum.Text]: TextElement,
    [ElementTypeEnum.Image]: ImageElement,
    [ElementTypeEnum.TextImageTitle]: TextImageTitleElement,
  };

/** Entrée de la palette de l'éditeur : ce qui est créé quand on la glisse sur la diapositive. */
export interface ElementPreset {
  id: string;
  label: string;
  /** Classe primeicons. */
  icon: string;
  type: ElementTypeEnum;
  /** Taille initiale, en unités logiques de diapositive (`SLIDE_WIDTH` × `SLIDE_HEIGHT`). */
  size: { width: number; height: number };
  configuration: string;
}

export const ELEMENT_PRESETS: readonly ElementPreset[] = [
  {
    id: 'title',
    label: 'Titre',
    icon: 'pi-heading',
    type: ElementTypeEnum.Text,
    size: { width: 896, height: 128 },
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
    size: { width: 512, height: 192 },
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
    size: { width: 512, height: 320 },
    configuration: JSON.stringify(IMAGE_DEFAULT_CONFIG satisfies ImageConfig),
  },
  {
    id: 'text-image-title',
    label: 'Titre, texte et image',
    icon: 'pi-th-large',
    type: ElementTypeEnum.TextImageTitle,
    size: { width: 1152, height: 576 },
    configuration: JSON.stringify(TEXT_IMAGE_TITLE_DEFAULT_CONFIG satisfies TextImageTitleConfig),
  },
];

export function findElementPreset(id: string): ElementPreset | undefined {
  return ELEMENT_PRESETS.find((preset) => preset.id === id);
}
