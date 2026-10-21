import { describe, expect, it } from 'vitest';

import { ELEMENT_COMPONENTS, ELEMENT_PRESETS } from './element-registry';

describe('element-registry', () => {
  it('associe un composant au type de chaque preset', () => {
    for (const preset of ELEMENT_PRESETS) {
      expect(ELEMENT_COMPONENTS[preset.type], preset.id).toBeDefined();
    }
  });

  it('a des ids de preset uniques et des configurations JSON valides', () => {
    const ids = ELEMENT_PRESETS.map((preset) => preset.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const preset of ELEMENT_PRESETS) {
      expect(() => JSON.parse(preset.configuration), preset.id).not.toThrow();
    }
  });
});
