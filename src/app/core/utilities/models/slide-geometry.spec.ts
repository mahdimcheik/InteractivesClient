import { describe, expect, it } from 'vitest';

import { MIN_ELEMENT_SIZE, SLIDE_HEIGHT, SLIDE_WIDTH, clampRect } from './slide-geometry';

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
