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

/** Poignée de redimensionnement : bords (`n`, `e`, `s`, `w`) et coins. */
export type ResizeHandle = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

export const RESIZE_HANDLES: readonly ResizeHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

export function moveRect(rect: SlideRect, dx: number, dy: number): SlideRect {
  return clampRect({ ...rect, x: rect.x + dx, y: rect.y + dy });
}

/**
 * Redimensionne depuis une poignée : le bord opposé reste fixe, et la taille ne descend pas sous
 * {@link MIN_ELEMENT_SIZE} ni ne dépasse la diapositive.
 */
export function resizeRect(
  rect: SlideRect,
  handle: ResizeHandle,
  dx: number,
  dy: number,
): SlideRect {
  let left = rect.x;
  let top = rect.y;
  let right = rect.x + rect.width;
  let bottom = rect.y + rect.height;

  if (handle.includes('w')) {
    left = Math.min(Math.max(left + dx, 0), right - MIN_ELEMENT_SIZE);
  }
  if (handle.includes('e')) {
    right = Math.max(Math.min(right + dx, SLIDE_WIDTH), left + MIN_ELEMENT_SIZE);
  }
  if (handle.includes('n')) {
    top = Math.min(Math.max(top + dy, 0), bottom - MIN_ELEMENT_SIZE);
  }
  if (handle.includes('s')) {
    bottom = Math.max(Math.min(bottom + dy, SLIDE_HEIGHT), top + MIN_ELEMENT_SIZE);
  }

  return clampRect({ x: left, y: top, width: right - left, height: bottom - top });
}
