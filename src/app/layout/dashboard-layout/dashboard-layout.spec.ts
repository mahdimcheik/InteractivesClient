import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { describe, expect, it, beforeEach } from 'vitest';

import { AuthMirrorService } from '@core/utilities/services/auth-mirror.service';

import { DashboardLayout } from './dashboard-layout';

describe('DashboardLayout', () => {
  let component: DashboardLayout;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DashboardLayout,
        {
          provide: Router,
          useValue: {
            events: new Subject(),
            navigateByUrl: () => Promise.resolve(true),
          },
        },
        {
          provide: AuthMirrorService,
          useValue: {
            fullName: () => 'Jane Doe',
            logout: () => of({}),
            clearSession: () => undefined,
          },
        },
      ],
    });

    component = TestBed.inject(DashboardLayout);
  });

  it('keeps the sidebar visible on desktop even when the toggle is closed', () => {
    (component as unknown as { isMobile: { set: (value: boolean) => void } }).isMobile.set(false);

    expect(component['sidebarOpen']()).toBe(false);
    expect(component['shouldShowSidebar']()).toBe(true);
  });
});
