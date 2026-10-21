import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ElementDetails } from '@client';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ElementsMirrorService } from '../services/elements-mirror.service';
import { NotificationService } from '../services/notification.service';
import { PresentationMode } from './enumerators';
import { SlideElementBase, parseElementConfig } from './slide-element-base';

interface DemoConfig {
  content: string;
  role: 'title' | 'body';
}

@Component({ selector: 'app-demo-element', template: '' })
class DemoElement extends SlideElementBase<DemoConfig> {
  protected readonly defaultConfig: DemoConfig = { content: '', role: 'body' };

  current(): DemoConfig {
    return this.config();
  }

  save(patch: Partial<DemoConfig>): void {
    this.saveConfig(patch);
  }
}

describe('parseElementConfig', () => {
  const defaults: DemoConfig = { content: '', role: 'body' };

  it('fusionne la configuration stockée avec les défauts', () => {
    expect(parseElementConfig('{"content":"Bonjour"}', defaults)).toEqual({
      content: 'Bonjour',
      role: 'body',
    });
  });

  it('retombe sur les défauts pour un JSON invalide, vide ou non objet', () => {
    expect(parseElementConfig('{oops', defaults)).toEqual(defaults);
    expect(parseElementConfig(null, defaults)).toEqual(defaults);
    expect(parseElementConfig('42', defaults)).toEqual(defaults);
  });
});

describe('SlideElementBase', () => {
  const element: ElementDetails = {
    id: 'el-1',
    slideId: 'slide-1',
    x: 10,
    y: 20,
    width: 100,
    height: 50,
    configuration: '{"content":"Avant"}',
  };
  const patch = vi.fn();
  const add = vi.fn();

  function create() {
    TestBed.configureTestingModule({
      providers: [
        { provide: ElementsMirrorService, useValue: { patch } },
        { provide: NotificationService, useValue: { add } },
      ],
    });
    const fixture = TestBed.createComponent(DemoElement);
    fixture.componentRef.setInput('element', element);
    fixture.componentRef.setInput('mode', PresentationMode.Edit);
    fixture.componentRef.setInput('presentationId', 'pres-1');
    return fixture;
  }

  beforeEach(() => {
    patch.mockReset();
    add.mockReset();
  });

  it('lit la configuration de l’élément, fusionnée avec les défauts', () => {
    const fixture = create();
    expect(fixture.componentInstance.current()).toEqual({ content: 'Avant', role: 'body' });

    fixture.componentRef.setInput('element', { ...element, configuration: '{"role":"title"}' });
    expect(fixture.componentInstance.current()).toEqual({ content: '', role: 'title' });
  });

  it('envoie la configuration fusionnée par patch', () => {
    patch.mockReturnValue(of(element));
    const component = create().componentInstance;

    component.save({ content: 'Après' });

    expect(patch).toHaveBeenCalledWith('pres-1', 'slide-1', 'el-1', {
      configuration: JSON.stringify({ content: 'Après', role: 'body' }),
    });
  });

  it('notifie en cas d’échec', () => {
    patch.mockReturnValue(throwError(() => new Error('500')));
    create().componentInstance.save({ content: 'Après' });

    expect(add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
  });
});
