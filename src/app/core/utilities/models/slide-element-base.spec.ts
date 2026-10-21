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
  const update = vi.fn();
  const add = vi.fn();

  function create() {
    TestBed.configureTestingModule({
      providers: [
        { provide: ElementsMirrorService, useValue: { update } },
        { provide: NotificationService, useValue: { add } },
      ],
    });
    const fixture = TestBed.createComponent(DemoElement);
    fixture.componentRef.setInput('element', element);
    fixture.componentRef.setInput('mode', PresentationMode.Edit);
    fixture.componentRef.setInput('presentationId', 'pres-1');
    return fixture.componentInstance;
  }

  beforeEach(() => {
    update.mockReset();
    add.mockReset();
  });

  it('enregistre la configuration fusionnée et la garde en local', () => {
    update.mockReturnValue(of(element));
    const component = create();

    component.save({ content: 'Après' });

    expect(component.current()).toEqual({ content: 'Après', role: 'body' });
    expect(update).toHaveBeenCalledWith(
      'pres-1',
      'slide-1',
      'el-1',
      expect.objectContaining({
        x: 10,
        y: 20,
        configuration: JSON.stringify({ content: 'Après', role: 'body' }),
      }),
    );
  });

  it('restaure la configuration précédente et notifie en cas d’échec', () => {
    update.mockReturnValue(throwError(() => new Error('500')));
    const component = create();

    component.save({ content: 'Après' });

    expect(component.current()).toEqual({ content: 'Avant', role: 'body' });
    expect(add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
  });
});
