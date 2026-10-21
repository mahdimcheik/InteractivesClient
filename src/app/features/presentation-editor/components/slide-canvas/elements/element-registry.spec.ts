import { TestBed } from '@angular/core/testing';
import { ElementTypeEnum } from '@client';
import { PresentationMode } from '@core/utilities/models/enumerators';
import { ElementsMirrorService } from '@core/utilities/services/elements-mirror.service';
import { MediasMirrorService } from '@core/utilities/services/medias-mirror.service';
import { NotificationService } from '@core/utilities/services/notification.service';
import { beforeEach, describe, expect, it } from 'vitest';

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

describe('éléments hors du mode Edit', () => {
  const image = {
    key: 'k',
    url: 'https://example.com/image.png',
    alt: 'Une image',
    fit: 'contain',
  };
  const configurations: Partial<Record<ElementTypeEnum, object>> = {
    [ElementTypeEnum.Text]: { content: 'Bonjour', role: 'title' },
    [ElementTypeEnum.Image]: image,
    [ElementTypeEnum.TextImageTitle]: { title: 'Titre', body: 'Texte', image },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ElementsMirrorService, useValue: {} },
        { provide: NotificationService, useValue: {} },
        { provide: MediasMirrorService, useValue: {} },
      ],
    });
  });

  const readOnlyModes = [
    PresentationMode.Presentation,
    PresentationMode.Client,
    PresentationMode.Thumbnail,
  ];

  for (const [type, component] of Object.entries(ELEMENT_COMPONENTS)) {
    for (const mode of readOnlyModes) {
      it(`${type} n'offre aucune affordance d'édition en mode ${PresentationMode[mode]}`, () => {
        const fixture = TestBed.createComponent(component!);
        fixture.componentRef.setInput('element', {
          id: 'el-1',
          slideId: 'slide-1',
          type,
          configuration: JSON.stringify(configurations[type as ElementTypeEnum] ?? {}),
        });
        fixture.componentRef.setInput('mode', mode);
        fixture.componentRef.setInput('presentationId', 'pres-1');
        fixture.detectChanges();

        const root: HTMLElement = fixture.nativeElement;
        expect(root.querySelector('[contenteditable], input, button, select, textarea')).toBeNull();
      });
    }
  }
});
