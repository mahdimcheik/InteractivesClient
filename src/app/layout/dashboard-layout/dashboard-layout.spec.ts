import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AuthMirrorService } from '@core/utilities/services/auth-mirror.service';
import { StorageService } from '@core/utilities/services/storage.service';

import { DashboardLayout } from './dashboard-layout';

function setViewportWidth(width: number): void {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
}

function createLayout(): DashboardLayout {
  const fixture = TestBed.createComponent(DashboardLayout);
  fixture.detectChanges();
  return fixture.componentInstance;
}

describe('DashboardLayout', () => {
  const initialWidth = window.innerWidth;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthMirrorService,
          useValue: {
            fullName: () => 'Jeanne Dupont',
            logout: () => of({}),
            clearSession: () => undefined,
          },
        },
      ],
    });
    TestBed.inject(StorageService).remove('sidebarCollapsed');
  });

  afterEach(() => setViewportWidth(initialWidth));

  it('sur bureau, affiche le menu et persiste son état réduit', () => {
    setViewportWidth(1280);
    const layout = createLayout();

    expect(layout['isNavVisible']()).toBe(true);
    expect(layout['isIconOnly']()).toBe(false);

    layout['toggleSidebar']();

    expect(layout['isIconOnly']()).toBe(true);
    expect(layout['toggleAriaLabel']()).toBe('Étendre le menu');
    expect(TestBed.inject(StorageService).get('sidebarCollapsed')).toBe('true');
  });

  it('sur mobile, ouvre le menu en superposition et le ferme avec Échap', () => {
    setViewportWidth(500);
    const layout = createLayout();

    expect(layout['isNavVisible']()).toBe(false);

    layout['toggleSidebar']();
    expect(layout['isOverlayVisible']()).toBe(true);
    expect(layout['toggleAriaExpanded']()).toBe(true);

    layout['onEscapeKeydown']();
    expect(layout['isOverlayVisible']()).toBe(false);
    expect(document.activeElement?.classList).toContain('sidebar-button');
  });
});
