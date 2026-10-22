import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ElementTypeEnum, PresentationDetails } from '@client';
import { ElementsMirrorService } from '@core/utilities/services/elements-mirror.service';
import { LiveSessionConnection } from '@core/utilities/services/live-session-connection';
import { LiveSessionsMirrorService } from '@core/utilities/services/live-sessions-mirror.service';
import { NotificationService } from '@core/utilities/services/notification.service';
import { Observable, of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { LiveSessionPage } from './live-session-page';

const presentation: PresentationDetails = {
  id: 'pres-1',
  title: 'Biologie',
  slides: ['Première', 'Deuxième'].map((content, i) => ({
    id: `s${i}`,
    elements: [
      { id: `e${i}`, type: ElementTypeEnum.Text, configuration: JSON.stringify({ content }) },
    ],
  })),
};

function setup(presentation$: Observable<PresentationDetails | undefined>) {
  const connection = {
    status: signal('connected'),
    currentSlideIndex: signal(0),
    participantCount: signal(0),
    ended: signal(false),
    joinAsParticipant: vi.fn(() => Promise.resolve()),
  };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: LiveSessionsMirrorService, useValue: { presentation: () => presentation$ } },
      { provide: ElementsMirrorService, useValue: {} },
      { provide: NotificationService, useValue: {} },
    ],
  });
  TestBed.overrideComponent(LiveSessionPage, {
    set: { providers: [{ provide: LiveSessionConnection, useValue: connection }] },
  });
  const fixture = TestBed.createComponent(LiveSessionPage);
  fixture.componentRef.setInput('code', 'abc234');
  return { fixture, connection, root: fixture.nativeElement as HTMLElement };
}

describe('LiveSessionPage', () => {
  it('rejoint la séance et suit la diapositive de l’hôte', async () => {
    const { fixture, connection, root } = setup(of(presentation));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(connection.joinAsParticipant).toHaveBeenCalledWith('ABC234');
    expect(root.querySelector('.live-slide')!.textContent).toContain('Première');

    connection.currentSlideIndex.set(1);
    fixture.detectChanges();
    expect(root.querySelector('.live-slide')!.textContent).toContain('Deuxième');
  });

  it('signale une séance introuvable', async () => {
    const { fixture, root } = setup(throwError(() => new Error('404')));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(root.textContent).toContain('Séance introuvable');
  });

  it('affiche la fin de séance', async () => {
    const { fixture, connection, root } = setup(of(presentation));
    await fixture.whenStable();
    connection.ended.set(true);
    fixture.detectChanges();

    expect(root.textContent).toContain('Séance terminée');
    expect(root.querySelector('.live-slide')).toBeNull();
  });
});
