import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { CompositionNavigationService } from './composition-navigation.service';
import { SHELL_CONTEXT } from './shell-contract';

describe('CompositionNavigationService', () => {
  it('delegates local appointment navigation to the shell global path', () => {
    const request = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        CompositionNavigationService,
        {
          provide: SHELL_CONTEXT,
          useValue: { navigation: { request } },
        },
      ],
    });

    TestBed.inject(CompositionNavigationService).request({
      localPath: '/calendar',
    });

    expect(request).toHaveBeenCalledWith({ path: '/app/appointments/calendar' });
  });

  it('preserves each query value when requesting shell navigation', () => {
    const request = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        CompositionNavigationService,
        { provide: SHELL_CONTEXT, useValue: { navigation: { request } } },
      ],
    });

    TestBed.inject(CompositionNavigationService).request({
      localPath: '/calendar',
      query: { status: ['PROGRAMADA', 'CONFIRMADA'] },
    });

    expect(request).toHaveBeenCalledWith({
      path: '/app/appointments/calendar?status=PROGRAMADA&status=CONFIRMADA',
    });
  });
});
