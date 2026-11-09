import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { CompositionNavigationService } from '../../composition-navigation.service';
import { SHELL_CONTEXT } from '../../shell-contract';
import { AppointmentsApiService } from '../data/appointments-api.service';
import { CLINIC_CLOCK } from '../data/clinic-clock';
import { Appointment } from '../model/appointment';
import { AppointmentListQuery } from '../model/appointment-operations';
import { Page } from '../model/page';
import { CalendarPageComponent } from './calendar-page.component';

const NOW = new Date('2026-11-07T15:00:00Z');

function appointment(id: string, startAt: string, endAt: string, status: Appointment['status'] = 'PROGRAMADA'): Appointment {
  return { id, patientId: 'p-1', dentistId: 'd-1', startAt, endAt, reason: `Motivo ${id}`, status, version: 1 };
}

function page(data: readonly Appointment[]): Page<Appointment> {
  return { data: [...data], meta: { page: 1, limit: 100, total: data.length, totalPages: data.length ? 1 : 0 } };
}

describe('CalendarPageComponent', () => {
  let queries: AppointmentListQuery[];
  let respond: (query: AppointmentListQuery) => Observable<Page<Appointment>>;

  async function create(
    roles: readonly string[] = ['SECRETARY_ASSISTANT'],
    extra: unknown[] = [],
  ): Promise<ComponentFixture<CalendarPageComponent>> {
    queries = queries ?? [];
    await TestBed.configureTestingModule({
      imports: [CalendarPageComponent],
      providers: [
        { provide: CLINIC_CLOCK, useValue: () => NOW },
        {
          provide: AppointmentsApiService,
          useValue: {
            listAppointments: (query: AppointmentListQuery) => {
              queries.push(query);
              return respond(query);
            },
          },
        },
        {
          provide: SHELL_CONTEXT,
          useValue: {
            session: { getSnapshot: () => ({ user: { id: 'staff-1', roles } }) },
            navigation: { request: vi.fn() },
          },
        },
        ...(extra as never[]),
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(CalendarPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  const text = (fixture: ComponentFixture<unknown>) => (fixture.nativeElement as HTMLElement).textContent ?? '';
  const query = (fixture: ComponentFixture<unknown>, selector: string) =>
    (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(selector);

  beforeEach(() => {
    queries = [];
    respond = () =>
      of(
        page([
          appointment('a-1', '2026-11-10T19:00:00Z', '2026-11-10T19:30:00Z'),
          appointment('a-2', '2026-11-11T03:30:00Z', '2026-11-11T04:00:00Z', 'CONFIRMADA'),
        ]),
      );
  });

  it('opens on the current clinic month and reads its range from the Appointments API', async () => {
    const fixture = await create();

    expect(query(fixture, '[data-calendar-period]')?.textContent?.trim()).toBe('Noviembre 2026');
    expect(queries[0]).toEqual({
      page: 1,
      limit: 100,
      from: '2026-11-01T00:00:00-05:00',
      to: '2026-12-01T00:00:00-05:00',
    });
  });

  it('places API appointments on their clinic day and time', async () => {
    const fixture = await create();

    const tenth = query(fixture, '[data-calendar-day][data-date="2026-11-10"]');
    expect(tenth?.querySelectorAll('[data-calendar-appointment]')).toHaveLength(2);
    expect(tenth?.textContent).toContain('14:00');
    expect(tenth?.textContent).toContain('22:30');
  });

  it('reads the next period when the user navigates', async () => {
    const fixture = await create();

    query(fixture, '[aria-label="Periodo siguiente"]')?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(queries.at(-1)).toMatchObject({ from: '2026-12-01T00:00:00-05:00', to: '2027-01-01T00:00:00-05:00' });
  });

  it('shows the owner error instead of inventing data', async () => {
    respond = () => throwError(() => ({ error: 'SERVICE_UNAVAILABLE', message: 'Servicio no disponible.', traceId: 't-1' }));
    const fixture = await create();

    expect(query(fixture, 'app-api-error-alert')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('[data-calendar-appointment]')).toHaveLength(0);
  });

  it('selects an appointment and shows its real details with the management actions', async () => {
    const fixture = await create();

    query(fixture, '[data-calendar-appointment="a-1"]')?.click();
    fixture.detectChanges();

    const panel = query(fixture, '[data-selected-appointment]');
    expect(panel?.textContent).toContain('10 de noviembre de 2026');
    expect(panel?.textContent).toContain('2:00 p. m.');
    expect(panel?.querySelector('app-appointment-actions')).not.toBeNull();
  });

  it('reloads the period after an appointment changes', async () => {
    const fixture = await create();
    const before = queries.length;

    fixture.componentInstance.updateAppointment({ ...appointment('a-1', '2026-11-10T19:00:00Z', '2026-11-10T19:30:00Z'), version: 2 });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(queries.length).toBe(before + 1);
  });

  it('has no demonstration panels, waiting list or simulated data', async () => {
    const fixture = await create();

    expect(query(fixture, '[data-demo-fixture]')).toBeNull();
    expect(query(fixture, '[data-waiting-count]')).toBeNull();
    expect(text(fixture)).not.toMatch(/Demostra|simulad/i);
  });

  it.each(['ADMINISTRATOR', 'SECRETARY_ASSISTANT'])('offers scheduling to %s', async (role) => {
    const fixture = await create([role]);

    expect(query(fixture, 'button[data-schedule-appointment].calendar-primary-action')?.textContent?.trim()).toBe(
      '+ Agendar nueva cita',
    );
  });

  it('does not offer scheduling to a dentist', async () => {
    const fixture = await create(['DENTIST']);

    expect(query(fixture, '[data-schedule-appointment]')).toBeNull();
  });

  it('uses shell navigation to request the composed scheduling route', async () => {
    const request = vi.fn();
    const fixture = await create(['ADMINISTRATOR'], [
      CompositionNavigationService,
      {
        provide: SHELL_CONTEXT,
        useValue: {
          session: { getSnapshot: () => ({ user: { id: 'staff-1', roles: ['ADMINISTRATOR'] } }) },
          navigation: { request },
        },
      },
    ]);

    query(fixture, '[data-schedule-appointment]')?.click();

    expect(request).toHaveBeenCalledWith({ path: '/app/appointments/new' });
  });

  it('keeps Angular Router navigation as the standalone fallback', async () => {
    const navigate = vi.fn();
    const fixture = await create(['ADMINISTRATOR'], [
      { provide: Router, useValue: { navigate, getCurrentNavigation: () => null } },
    ]);

    query(fixture, '[data-schedule-appointment]')?.click();

    expect(navigate).toHaveBeenCalledWith(['/new']);
  });

  it('switches to the week of the current day and moves by seven days', async () => {
    const fixture = await create();

    query(fixture, '[data-calendar-view="week"]')?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('[data-calendar-day]')).toHaveLength(7);

    query(fixture, '[aria-label="Periodo siguiente"]')?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(queries.at(-1)).toMatchObject({ from: '2026-11-08T00:00:00-05:00', to: '2026-11-15T00:00:00-05:00' });
  });

  it('opens an ordered daily preview with every appointment of the day', async () => {
    const fixture = await create();

    query(fixture, '[data-daily-preview-trigger="2026-11-10"]')?.click();
    fixture.detectChanges();

    const items = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('[data-daily-preview-appointment]'),
    ).map((item) => item.getAttribute('data-daily-preview-appointment'));
    expect(items).toEqual(['a-1', 'a-2']);
  });

  describe('a busy day', () => {
    const busy = ['13:00', '14:00', '15:00', '16:00', '17:00'].map((time, index) =>
      appointment(`b-${index + 1}`, `2026-11-05T${time}:00Z`, `2026-11-05T${time.slice(0, 2)}:30:00Z`),
    );
    const ids = (root: HTMLElement, selector: string, attribute: string) =>
      Array.from(root.querySelectorAll(selector)).map((item) =>
        item.getAttribute(attribute),
      );

    beforeEach(() => {
      respond = () => of(page(busy));
    });

    it('shows every appointment of the day in the week view, without hiding any behind "+N"', async () => {
      const fixture = await create();
      query(fixture, '[data-calendar-view="week"]')?.click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const day = query(fixture, '[data-calendar-day][data-date="2026-11-05"]')!;
      expect(ids(day, '[data-calendar-appointment]', 'data-calendar-appointment')).toEqual(
        busy.map((item) => item.id),
      );
      expect(day.querySelector('[data-calendar-more]')).toBeNull();
    });

    it('lists the hidden appointments when "+N" is pressed in the month view', async () => {
      const fixture = await create();
      const more = query(fixture, '[data-calendar-day][data-date="2026-11-05"] [data-calendar-more]')!;
      expect(more.textContent?.trim()).toBe('+3');

      more.click();
      fixture.detectChanges();

      expect(ids(fixture.nativeElement as HTMLElement, '[data-daily-preview-appointment]', 'data-daily-preview-appointment')).toEqual(
        busy.map((item) => item.id),
      );
    });
  });
});
