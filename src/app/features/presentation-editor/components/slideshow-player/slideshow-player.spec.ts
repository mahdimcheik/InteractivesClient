import { TestBed } from '@angular/core/testing';
import { ElementTypeEnum, PresentationDetails } from '@client';
import { ElementsMirrorService } from '@core/utilities/services/elements-mirror.service';
import { NotificationService } from '@core/utilities/services/notification.service';
import { beforeEach, describe, expect, it } from 'vitest';

import { SlideshowPlayer } from './slideshow-player';

const text = (id: string, content: string, visible = true) => ({
  id,
  type: ElementTypeEnum.Text,
  visible,
  configuration: JSON.stringify({ content }),
});

const presentation: PresentationDetails = {
  id: 'pres-1',
  slides: [
    { id: 's1', elements: [text('a', 'Première'), text('b', 'Cachée', false)] },
    { id: 's2', elements: [text('c', 'Deuxième')] },
    { id: 's3', elements: [text('d', 'Troisième')] },
  ],
};

describe('SlideshowPlayer', () => {
  let host: HTMLElement;
  let closedWith: number[];
  let changes: number[];
  let detect: () => void;

  const press = (key: string) => {
    host.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    detect();
  };
  const shown = () => host.querySelector('.player-slide')!.textContent!.trim();

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ElementsMirrorService, useValue: {} },
        { provide: NotificationService, useValue: {} },
      ],
    });
    const fixture = TestBed.createComponent(SlideshowPlayer);
    fixture.componentRef.setInput('presentation', presentation);
    fixture.componentRef.setInput('startIndex', 0);
    closedWith = [];
    changes = [];
    fixture.componentInstance.closed.subscribe((index) => closedWith.push(index));
    fixture.componentInstance.indexChange.subscribe((index) => changes.push(index));
    fixture.detectChanges();
    host = fixture.nativeElement;
    detect = () => fixture.detectChanges();
  });

  it('ne rend pas les éléments masqués', () => {
    expect(shown()).toBe('Première');
  });

  it('navigue au clavier sans dépasser les bornes', () => {
    press('ArrowRight');
    press(' ');
    press('PageDown');
    expect(shown()).toBe('Troisième');

    press('Home');
    press('ArrowLeft');
    expect(shown()).toBe('Première');

    press('End');
    expect(host.querySelector('[aria-live]')!.textContent).toContain('Diapositive 3 sur 3');
  });

  it('Échap ferme en rendant la dernière diapositive affichée', () => {
    press('ArrowRight');
    press('Escape');
    expect(closedWith).toEqual([1]);
  });

  it('émet chaque changement de diapositive, pas les appuis sans effet', () => {
    press('ArrowLeft');
    press('ArrowRight');
    press('End');
    press('End');
    expect(changes).toEqual([1, 2]);
  });
});
