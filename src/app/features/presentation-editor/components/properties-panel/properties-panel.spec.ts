import { TestBed } from '@angular/core/testing';
import { ElementDetails, ElementTypeEnum, SlideDetails } from '@client';
import { SLIDE_WIDTH } from '@core/utilities/models/slide-geometry';
import { ElementsMirrorService } from '@core/utilities/services/elements-mirror.service';
import { NotificationService } from '@core/utilities/services/notification.service';
import { SlidesMirrorService } from '@core/utilities/services/slides-mirror.service';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PropertiesPanel } from './properties-panel';

describe('PropertiesPanel', () => {
  const patch = vi.fn(() => of(undefined));
  const updateSlide = vi.fn(() => of(undefined));
  const slide: SlideDetails = { id: 'slide-1', backgroundColor: '#ffeecc' };
  const element: ElementDetails = {
    id: 'el-1',
    slideId: 'slide-1',
    type: ElementTypeEnum.Text,
    x: 100,
    y: 100,
    width: 300,
    height: 100,
    configuration: '{"content":"Bonjour"}',
  };

  function render(selected?: ElementDetails): HTMLElement {
    const fixture = TestBed.createComponent(PropertiesPanel);
    fixture.componentRef.setInput('presentationId', 'pres-1');
    fixture.componentRef.setInput('slide', slide);
    fixture.componentRef.setInput('element', selected);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  function change(input: HTMLInputElement | HTMLSelectElement, value: string): void {
    input.value = value;
    input.dispatchEvent(new Event('change'));
  }

  beforeEach(() => {
    patch.mockClear();
    updateSlide.mockClear();
    TestBed.configureTestingModule({
      providers: [
        { provide: ElementsMirrorService, useValue: { patch } },
        { provide: SlidesMirrorService, useValue: { update: updateSlide } },
        { provide: NotificationService, useValue: { add: vi.fn() } },
      ],
    });
  });

  it('sans sélection, modifie l’arrière-plan de la diapositive', () => {
    const root = render();
    const input = root.querySelector<HTMLInputElement>('#prop-slide-background')!;
    expect(input.value).toBe('#ffeecc');

    change(input, '#000000');
    expect(updateSlide).toHaveBeenCalledWith('pres-1', 'slide-1', { backgroundColor: '#000000' });
  });

  it('borne la position saisie à la diapositive', () => {
    const root = render(element);
    change(root.querySelector<HTMLInputElement>('#prop-x')!, '5000');

    expect(patch).toHaveBeenCalledWith('pres-1', 'slide-1', 'el-1', {
      x: SLIDE_WIDTH - 300,
      y: 100,
      width: 300,
      height: 100,
    });
  });

  it('affiche le panneau du type et enregistre la mise en forme dans la configuration', () => {
    const root = render(element);
    root.querySelector<HTMLButtonElement>('button[aria-label="Gras"]')!.click();
    change(root.querySelector<HTMLInputElement>('#prop-text-size')!, '500');

    const sent = patch.mock.calls.map((call) =>
      JSON.parse(
        (call as unknown as [string, string, string, { configuration: string }])[3].configuration,
      ),
    );
    expect(sent).toEqual([
      expect.objectContaining({ content: 'Bonjour', bold: true }),
      expect.objectContaining({ content: 'Bonjour', fontSize: 200 }),
    ]);
  });
});
