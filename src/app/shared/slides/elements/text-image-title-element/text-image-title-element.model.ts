import { IMAGE_DEFAULT_CONFIG, ImageConfig } from '../image-element/image-element.model';

export type ImagePosition = 'left' | 'right';

export interface TextImageTitleConfig {
  title: string;
  body: string;
  image: ImageConfig;
  imagePosition: ImagePosition;
}

export const TEXT_IMAGE_TITLE_DEFAULT_CONFIG: TextImageTitleConfig = {
  title: 'Titre',
  body: 'Texte',
  image: IMAGE_DEFAULT_CONFIG,
  imagePosition: 'right',
};
