export type ImageFit = 'contain' | 'cover';

export interface ImageConfig {
  /** Clé du fichier dans le stockage (`StoredFile.key`), pour une suppression future. */
  key: string | null;
  url: string | null;
  alt: string;
  fit: ImageFit;
}

export const IMAGE_DEFAULT_CONFIG: ImageConfig = {
  key: null,
  url: null,
  alt: '',
  fit: 'contain',
};
