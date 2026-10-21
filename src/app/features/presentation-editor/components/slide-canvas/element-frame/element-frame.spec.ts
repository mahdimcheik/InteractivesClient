import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ElementDetails } from '@client';
import { SlideRect } from '@core/utilities/models/slide-geometry';
import { beforeEach, describe, expect, it } from 'vitest';

import { ElementAction, ElementFrame } from './element-frame';

@Component({
  imports: [ElementFrame],
  template: `
    <app-element-frame
      [element]="element()"
      label="Titre"
      [selected]="selected()"
      [scale]="0.5"
      (selectRequested)="selected.set(true)"
      (deselectRequested)="selected.set(false)"
      (rectCommitted)="committed.push($event)"
      (action)="actions.push($event)"
    >
      <span contenteditable="true">Texte</span>
    </app-element-frame>
  `,
})
class Host {
  readonly element = signal<ElementDetails>({
    id: 'el-1',
    x: 100,
    y: 100,
    width: 200,
    height: 100,
  });
  readonly selected = signal(false);
  readonly committed: SlideRect[] = [];
  readonly actions: ElementAction[] = [];
}

describe('ElementFrame', () => {
  let host: Host;
  let frame: HTMLElement;
  let detect: () => void;

  const key = (type: 'keydown' | 'keyup', init: KeyboardEventInit) => {
    frame.dispatchEvent(new KeyboardEvent(type, { bubbles: true, ...init }));
    detect();
  };

  beforeEach(() => {
    const fixture = TestBed.createComponent(Host);
    fixture.autoDetectChanges();
    host = fixture.componentInstance;
    frame = fixture.nativeElement.querySelector('app-element-frame');
    detect = () => fixture.detectChanges();
  });

  it('déplace aux flèches et n’enregistre qu’au relâchement', () => {
    key('keydown', { key: 'ArrowRight' });
    key('keydown', { key: 'ArrowRight', shiftKey: true });
    expect(frame.style.left).toBe('111px');
    expect(host.committed).toEqual([]);

    key('keyup', { key: 'ArrowRight' });
    expect(host.committed).toEqual([{ x: 111, y: 100, width: 200, height: 100 }]);
    expect(host.selected()).toBe(true);
  });

  it('redimensionne avec Alt et flèches', () => {
    key('keydown', { key: 'ArrowDown', altKey: true });
    key('keyup', { key: 'ArrowDown' });
    expect(host.committed).toEqual([{ x: 100, y: 100, width: 200, height: 110 }]);
  });

  it('ne déplace pas un élément verrouillé', () => {
    host.element.update((e) => ({ ...e, locked: true }));
    detect();
    key('keydown', { key: 'ArrowLeft' });
    key('keyup', { key: 'ArrowLeft' });
    expect(host.committed).toEqual([]);
  });

  it('Suppr demande la suppression, Échap la désélection', () => {
    host.selected.set(true);
    detect();
    key('keydown', { key: 'Delete' });
    key('keydown', { key: 'Escape' });
    expect(host.actions).toEqual(['remove']);
    expect(host.selected()).toBe(false);
  });

  it('Entrée rend le contenu accessible, Échap le referme', () => {
    const content = frame.querySelector<HTMLElement>('.frame-content')!;
    expect(content.inert).toBe(true);

    key('keydown', { key: 'Enter' });
    expect(content.inert).toBe(false);

    content
      .querySelector('span')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    detect();
    expect(content.inert).toBe(true);
    expect(host.selected()).toBe(true);
  });

  it('convertit un glisser du pointeur selon l’échelle', () => {
    frame.setPointerCapture = () => undefined;
    const pointer = (type: string, clientX: number, clientY: number) => {
      const event = new MouseEvent(type, { bubbles: true, button: 0, clientX, clientY });
      Object.defineProperty(event, 'pointerId', { value: 1 });
      frame.dispatchEvent(event);
      detect();
    };

    pointer('pointerdown', 10, 10);
    pointer('pointermove', 30, 20);
    pointer('pointerup', 30, 20);

    // Échelle 0,5 : 20 px d'écran valent 40 unités logiques.
    expect(host.committed).toEqual([{ x: 140, y: 120, width: 200, height: 100 }]);
  });
});
