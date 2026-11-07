import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';

import { SHELL_CONTEXT } from '../../shell-contract';
import { AppointmentsApiService } from '../data/appointments-api.service';
import { CLINIC_CLOCK } from '../data/clinic-clock';
import { PatientsLookupService } from '../data/patients-lookup.service';
import { Appointment } from '../model/appointment';
import { AppointmentListQuery } from '../model/appointment-operations';
import { Page } from '../model/page';
import { DentistOwnCalendarComponent } from './dentist-own-calendar.component';

const NOW = new Date('2026-11-10T15:00:00Z');

const own = (id: string, startAt: string, patientId = 'p-1'): Appointment => ({
  id,
  patientId,
  dentistId: 'dentist-7',
  startAt,
  endAt: startAt.replace(':00:00Z', ':30:00Z'),
  status: 'PROGRAMADA',
  version: 1,
});

describe('DentistOwnCalendarComponent', () => {
  let queries: AppointmentListQuery[];
  let respond: () => Observable<Page<Appointment>>;
  let patientReads: string[];

  async function create(): Promise<ComponentFixture<DentistOwnCalendarComponent>> {
    await TestBed.configureTestingModule({
      imports: [DentistOwnCalendarComponent],
      providers: [
        { provide: CLINIC_CLOCK, useValue: () => NOW },
        {
          provide: SHELL_CONTEXT,
          useValue: { session: { getSnapshot: () => ({ user: { id: 'dentist-7', name: 'Dra. Ruiz', roles: ['DENTIST'] } }) } },
        },
        {
          provide: AppointmentsApiService,
          useValue: {
            listAppointments: (query: AppointmentListQuery) => {
              queries.push(query);
              return respond();
            },
          },
        },
        {
          provide: PatientsLookupService,
          useValue: {
            getPatient: (id: string) => {
              patientReads.push(id);
              return id === 'p-1'
                ? of({ id, name: 'Ana Torres', status: 'ACTIVE', version: 1 })
                : throwError(() => ({ error: 'FORBIDDEN', message: 'No autorizado', traceId: '' }));
            },
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(DentistOwnCalendarComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  const el = (fixture: ComponentFixture<unknown>) => fixture.nativeElement as HTMLElement;

  beforeEach(() => {
    queries = [];
    patientReads = [];
    respond = () =>
      of({
        data: [own('a-1', '2026-11-10T19:00:00Z'), own('a-2', '2026-11-12T14:00:00Z', 'p-2')],
        meta: { page: 1, limit: 100, total: 2, totalPages: 1 },
      });
  });

  it('reads only the signed-in dentist appointments for the current clinic month', async () => {
    const fixture = await create();

    expect(el(fixture).querySelector('[data-own-calendar-period]')?.textContent?.trim()).toBe('Noviembre 2026');
    expect(queries[0]).toEqual({
      page: 1,
      limit: 100,
      dentistId: 'dentist-7',
      from: '2026-11-01T00:00:00-05:00',
      to: '2026-12-01T00:00:00-05:00',
    });
  });

  it('shows each appointment on its clinic day and time', async () => {
    const fixture = await create();

    const day = el(fixture).querySelector('[data-own-calendar-day][data-date="2026-11-10"]')?.closest('.calendar-day');
    expect(day?.textContent).toContain('2:00 p. m.');
  });

  it('names patients through the Patients owner and keeps a neutral label when it denies access', async () => {
    const fixture = await create();

    expect(patientReads.sort()).toEqual(['p-1', 'p-2']);
    expect(el(fixture).textContent).toContain('Ana Torres');

    el(fixture).querySelector<HTMLElement>('[data-own-calendar-day][data-date="2026-11-12"]')?.click();
    fixture.detectChanges();
    expect(el(fixture).textContent).toContain('Paciente sin acceso');
  });

  it('opens the detail of a selected appointment', async () => {
    const fixture = await create();

    el(fixture).querySelector<HTMLElement>('[data-appointment-id="a-1"]')?.click();
    fixture.detectChanges();

    const detail = el(fixture).querySelector('[data-own-appointment-detail]');
    expect(detail?.textContent).toContain('10 de noviembre de 2026');
    expect(detail?.textContent).toContain('Ana Torres');
  });

  it('reads the next month when navigating', async () => {
    const fixture = await create();

    el(fixture).querySelector<HTMLElement>('[aria-label="Periodo siguiente"]')?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(queries.at(-1)).toMatchObject({ from: '2026-12-01T00:00:00-05:00', dentistId: 'dentist-7' });
  });

  it('shows the owner error and no invented data', async () => {
    respond = () => throwError(() => ({ error: 'SERVICE_UNAVAILABLE', message: 'No disponible', traceId: 't' }));
    const fixture = await create();

    expect(el(fixture).querySelector('app-api-error-alert')).not.toBeNull();
    expect(el(fixture).querySelector('[data-own-calendar-appointment]')).toBeNull();
    expect(el(fixture).textContent).not.toMatch(/demostrativ/i);
    expect(el(fixture).querySelector('[data-demo-dentist]')).toBeNull();
  });
});
