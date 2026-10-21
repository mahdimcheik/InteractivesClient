import { ElementDetails } from '@client';

/**
 * Repère logique de toute diapositive : les positions et tailles des éléments sont stockées dans
 * ce repère, puis mises à l'échelle à l'affichage. Une même diapositive se rend ainsi à
 * l'identique chez l'hôte, chez chaque participant et en miniature.
 */
export const SLIDE_WIDTH = 1280;
export const SLIDE_HEIGHT = 720;

/** Plus petite largeur ou hauteur d'un élément, en unités logiques. */
export const MIN_ELEMENT_SIZE = 24;

export interface SlideRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function elementRect(element: ElementDetails): SlideRect {
  return {
    x: element.x ?? 0,
    y: element.y ?? 0,
    width: element.width ?? MIN_ELEMENT_SIZE,
    height: element.height ?? MIN_ELEMENT_SIZE,
  };
}

/** Taille bornée à la diapositive, position ramenée pour que l'élément y tienne entièrement. */
export function clampRect(rect: SlideRect): SlideRect {
  const width = Math.round(Math.min(Math.max(rect.width, MIN_ELEMENT_SIZE), SLIDE_WIDTH));
  const height = Math.round(Math.min(Math.max(rect.height, MIN_ELEMENT_SIZE), SLIDE_HEIGHT));
  return {
    x: Math.round(Math.min(Math.max(rect.x, 0), SLIDE_WIDTH - width)),
    y: Math.round(Math.min(Math.max(rect.y, 0), SLIDE_HEIGHT - height)),
    width,
    height,
  };
}
