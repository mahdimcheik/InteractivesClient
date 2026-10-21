import { describe, expect, it } from 'vitest';

import {
  MIN_ELEMENT_SIZE,
  SLIDE_HEIGHT,
  SLIDE_WIDTH,
  clampRect,
  moveRect,
  resizeRect,
} from './slide-geometry';

describe('clampRect', () => {
  it('ramène dans la diapositive un élément qui déborde', () => {
    expect(clampRect({ x: 1200, y: -40, width: 200, height: 100 })).toEqual({
      x: SLIDE_WIDTH - 200,
      y: 0,
      width: 200,
      height: 100,
    });
  });

  it('borne la taille entre le minimum et la diapositive, et arrondit', () => {
    expect(clampRect({ x: 10.4, y: 0, width: 2, height: 5000 })).toEqual({
      x: 10,
      y: 0,
      width: MIN_ELEMENT_SIZE,
      height: SLIDE_HEIGHT,
    });
  });
});

describe('resizeRect', () => {
  const rect = { x: 100, y: 100, width: 200, height: 100 };

  it('garde fixe le bord opposé à la poignée', () => {
    expect(resizeRect(rect, 'nw', -50, -20)).toEqual({ x: 50, y: 80, width: 250, height: 120 });
    expect(resizeRect(rect, 'e', 30, 999)).toEqual({ x: 100, y: 100, width: 230, height: 100 });
  });

  it('ne passe pas sous la taille minimale ni hors de la diapositive', () => {
    expect(resizeRect(rect, 'w', 500, 0)).toEqual({
      x: 300 - MIN_ELEMENT_SIZE,
      y: 100,
      width: MIN_ELEMENT_SIZE,
      height: 100,
    });
    expect(resizeRect(rect, 'se', 5000, 5000)).toEqual({
      x: 100,
      y: 100,
      width: SLIDE_WIDTH - 100,
      height: SLIDE_HEIGHT - 100,
    });
  });
});

describe('moveRect', () => {
  it('déplace sans sortir de la diapositive', () => {
    expect(moveRect({ x: 10, y: 10, width: 50, height: 50 }, -40, 25)).toEqual({
      x: 0,
      y: 35,
      width: 50,
      height: 50,
    });
  });
});
