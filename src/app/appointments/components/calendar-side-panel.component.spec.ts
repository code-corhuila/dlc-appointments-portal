import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { SHELL_CONTEXT } from '../../shell-contract';
import { AppointmentsApiService } from '../data/appointments-api.service';
import { CalendarSidePanelComponent } from './calendar-side-panel.component';

const TYPES = [
  { code: 'CONSULTA', label: 'Consulta general', color: '#2563EB' },
  { code: 'LIMPIEZA', label: 'Limpieza', color: '#0D9488' },
];
const ENTRY = {
  id: 'w-1', patientId: 'p-1', reason: 'Limpieza pendiente', preferredFrom: '2026-11-10', preferredTo: '2026-11-20',
  status: 'WAITING', createdAt: '2026-11-09T12:00:00Z', createdBy: 's-1', version: 1,
};

describe('CalendarSidePanelComponent', () => {
  async function create(roles: readonly string[]) {
    const api = {
      listAppointmentTypes: vi.fn(() => of({ data: TYPES })),
      listWaitingList: vi.fn(() => of({ data: [ENTRY], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } })),
      resolveWaitingListEntry: vi.fn(() => of({ ...ENTRY, status: 'WITHDRAWN', version: 2 })),
    };
    await TestBed.configureTestingModule({
      imports: [CalendarSidePanelComponent],
      providers: [
        { provide: AppointmentsApiService, useValue: api },
        { provide: SHELL_CONTEXT, useValue: { session: { getSnapshot: () => ({ user: { id: 's-1', roles } }) } } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(CalendarSidePanelComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, api, root: fixture.nativeElement as HTMLElement };
  }

  it('shows the appointment-type legend from the Appointments catalog', async () => {
    const { root } = await create(['DENTIST']);
    const items = Array.from(root.querySelectorAll('[data-type-legend] li'));
    expect(items.map((item) => item.textContent?.trim())).toEqual(['Consulta general', 'Limpieza']);
    expect((items[0].querySelector('[data-type-swatch]') as HTMLElement).style.backgroundColor).toBe(
      'rgb(37, 99, 235)',
    );
  });

  it('shows the waiting list to staff and withdraws an entry with its version', async () => {
    const { fixture, api, root } = await create(['SECRETARY_ASSISTANT']);
    expect(root.querySelector('[data-waiting-count]')?.textContent?.trim()).toBe('1');
    expect(root.querySelector('[data-waiting-entry="w-1"]')?.textContent).toContain('Limpieza pendiente');

    (root.querySelector('[data-waiting-withdraw="w-1"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(api.resolveWaitingListEntry).toHaveBeenCalledWith('w-1', { outcome: 'WITHDRAWN', expectedVersion: 1 },
      expect.any(String));
    expect(root.querySelector('[data-waiting-entry="w-1"]')).toBeNull();
  });

  it('hides the waiting list from a dentist and never requests it', async () => {
    const { api, root } = await create(['DENTIST']);
    expect(root.querySelector('[data-waiting-list]')).toBeNull();
    expect(api.listWaitingList).not.toHaveBeenCalled();
  });
});
