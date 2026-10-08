import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  Observable,
  Subject,
  of,
  throwError,
} from 'rxjs';

import { AppointmentsApiService } from '../data/appointments-api.service';
import { PatientsLookupService } from '../data/patients-lookup.service';
import { DentistAvailability } from '../model/availability';
import { Page } from '../model/page';
import {
  PatientLookupQuery,
  PatientView,
} from '../model/patient';
import { SchedulingPageComponent } from './scheduling-page.component';

describe('SchedulingPageComponent', () => {
  let fixture: ComponentFixture<SchedulingPageComponent>;
  let requestedDentistIds: string[];
  let availabilityResponse: Observable<DentistAvailability>;

  let patientSearches: PatientLookupQuery[];
  let patientSearchResponse: Observable<Page<PatientView>>;

  const availability: DentistAvailability = {
    id: 'availability-123',
    dentistId: 'dentist-123',
    intervals: [
      {
        startAt: '2026-10-05T14:00:00Z',
        endAt: '2026-10-05T15:00:00Z',
      },
    ],
    blockedIntervals: [],
    version: 1,
  };

  beforeEach(async () => {
    requestedDentistIds = [];
    availabilityResponse = of(availability);

    patientSearches = [];
    patientSearchResponse = of({
      data: [],
      meta: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    });

    await TestBed.configureTestingModule({
      imports: [SchedulingPageComponent],
      providers: [
        {
          provide: AppointmentsApiService,
          useValue: {
            getDentistAvailability: (dentistId: string) => {
              requestedDentistIds.push(dentistId);
              return availabilityResponse;
            },
          },
        },
        {
          provide: PatientsLookupService,
          useValue: {
            searchPatients: (query: PatientLookupQuery) => {
              patientSearches.push(query);
              return patientSearchResponse;
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SchedulingPageComponent);
    fixture.detectChanges();
  });

  it('renders the scheduling structure aligned with the mockup', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent)
      .toContain('Agendar Nueva Cita');

    expect(element.textContent).toContain('Paciente');
    expect(element.textContent).toContain('Detalles de la Cita');
    expect(element.textContent).toContain('Especialista');
    expect(element.textContent).toContain('Motivo y Notas');
    expect(element.textContent).toContain('Resumen de Cita');

    expect(
      element.querySelector('[data-new-patient]'),
    ).not.toBeNull();

    expect(
      element.querySelector('#specialty'),
    ).not.toBeNull();

    expect(
      element.querySelector('#consultation-type'),
    ).not.toBeNull();

    expect(
      element.querySelector('#dentist'),
    ).not.toBeNull();
  });

  it('searches active patients and renders matching results', () => {
    patientSearchResponse = of({
      data: [
        {
          id: 'patient-123',
          name: 'Ana Torres',
          status: 'ACTIVE',
          version: 1,
          documentType: 'CC',
          documentNumber: '123456789',
          phone: '3001234567',
        },
      ],
      meta: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    });

    searchPatient('Ana');

    const element = fixture.nativeElement as HTMLElement;

    expect(patientSearches).toEqual([
      {
        search: 'Ana',
        status: 'ACTIVE',
      },
    ]);

    const result = element.querySelector(
      '[data-patient-result]',
    );

    expect(result).not.toBeNull();
    expect(result?.textContent).toContain('Ana Torres');
    expect(result?.textContent).toContain('123456789');
  });

  it('selects a patient and shows it in the appointment summary', () => {
    patientSearchResponse = of({
      data: [
        {
          id: 'patient-123',
          name: 'Ana Torres',
          status: 'ACTIVE',
          version: 1,
          documentType: 'CC',
          documentNumber: '123456789',
          phone: '3001234567',
        },
      ],
      meta: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    });

    searchPatient('Ana');

    const element = fixture.nativeElement as HTMLElement;

    const patientResult =
      element.querySelector<HTMLButtonElement>(
        '[data-patient-result]',
      );

    expect(patientResult).not.toBeNull();

    patientResult?.click();
    fixture.detectChanges();

    expect(
      element.querySelector('[data-selected-patient]')?.textContent,
    ).toContain('Ana Torres');

    expect(
      element.querySelectorAll('[data-patient-result]').length,
    ).toBe(0);
  });

  it('shows clinic timezone without invented slots initially', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Hora Sugerida');
    expect(element.textContent).toContain('America/Bogota');

    expect(
      element.querySelectorAll('[data-available-slot]').length,
    ).toBe(0);
  });

  it('shows loading feedback while dentist availability is pending', () => {
    const pendingAvailability = new Subject<DentistAvailability>();
    availabilityResponse = pendingAvailability;

    selectDentist('dentist-123');
    selectDate('2026-10-05');

    const element = fixture.nativeElement as HTMLElement;

    expect(requestedDentistIds).toEqual(['dentist-123']);

    expect(
      element.querySelector('[data-availability-loading]'),
    ).not.toBeNull();
  });

  it('shows empty feedback when no slots are available for the selected date', () => {
    availabilityResponse = of({
      ...availability,
      intervals: [],
    });

    selectDentist('dentist-123');
    selectDate('2026-10-05');

    const element = fixture.nativeElement as HTMLElement;

    expect(requestedDentistIds).toEqual(['dentist-123']);

    expect(
      element.querySelector('[data-availability-empty]'),
    ).not.toBeNull();

    expect(
      element.querySelector('[data-availability-empty]')?.textContent,
    ).toContain('No hay horarios disponibles');
  });

  it('shows an error and retries the availability request', () => {
    availabilityResponse = throwError(
      () => new Error('Availability unavailable'),
    );

    selectDentist('dentist-123');
    selectDate('2026-10-05');

    const element = fixture.nativeElement as HTMLElement;

    expect(requestedDentistIds).toEqual(['dentist-123']);

    expect(
      element.querySelector('[data-availability-error]'),
    ).not.toBeNull();

    const retryButton =
      element.querySelector<HTMLButtonElement>(
        '[data-availability-retry]',
      );

    expect(retryButton).not.toBeNull();
    expect(retryButton?.textContent).toContain('Reintentar');

    availabilityResponse = of(availability);

    retryButton?.click();
    fixture.detectChanges();

    expect(requestedDentistIds).toEqual([
      'dentist-123',
      'dentist-123',
    ]);

    expect(
      element.querySelector('[data-availability-error]'),
    ).toBeNull();

    expect(
      element.querySelectorAll('[data-available-slot]').length,
    ).toBe(2);
  });

  it('handles malformed availability data without breaking the page', () => {
    availabilityResponse = of({
      ...availability,
      intervals: [
        {
          startAt: 'invalid-date-time',
          endAt: '2026-10-05T15:00:00Z',
        },
      ],
    });

    selectDentist('dentist-123');

    expect(
      () => selectDate('2026-10-05'),
    ).not.toThrow();

    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(requestedDentistIds).toEqual(['dentist-123']);

    expect(
      element.querySelectorAll('[data-available-slot]').length,
    ).toBe(0);

    expect(
      element.querySelector('[data-availability-error]'),
    ).not.toBeNull();
  });

  it('ignores a stale availability response after the selected date changes', () => {
    const firstRequest = new Subject<DentistAvailability>();
    const secondRequest = new Subject<DentistAvailability>();

    availabilityResponse = firstRequest;

    selectDentist('dentist-123');
    selectDate('2026-10-05');

    availabilityResponse = secondRequest;

    selectDate('2026-10-06');

    firstRequest.next({
      ...availability,
      intervals: [
        {
          startAt: '2026-10-05T14:00:00Z',
          endAt: '2026-10-05T15:00:00Z',
        },
      ],
    });
    firstRequest.complete();

    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(
      element.querySelectorAll('[data-available-slot]').length,
    ).toBe(0);

    expect(
      element.querySelector('[data-availability-loading]'),
    ).not.toBeNull();

    secondRequest.next({
      ...availability,
      intervals: [
        {
          startAt: '2026-10-06T15:00:00Z',
          endAt: '2026-10-06T16:00:00Z',
        },
      ],
    });
    secondRequest.complete();

    fixture.detectChanges();

    const slots = Array.from(
      element.querySelectorAll<HTMLButtonElement>(
        '[data-available-slot]',
      ),
    );

    expect(requestedDentistIds).toEqual([
      'dentist-123',
      'dentist-123',
    ]);

    expect(
      slots.map((slot) => slot.textContent?.trim()),
    ).toEqual(['10:00', '10:30']);

    expect(
      element.querySelector('[data-availability-loading]'),
    ).toBeNull();
  });

  it('loads dentist availability and renders slots for the selected date', () => {
    selectDentist('dentist-123');
    selectDate('2026-10-05');

    const element = fixture.nativeElement as HTMLElement;

    const slots = Array.from(
      element.querySelectorAll<HTMLButtonElement>(
        '[data-available-slot]',
      ),
    );

    expect(requestedDentistIds).toEqual(['dentist-123']);

    expect(
      slots.map((slot) => slot.textContent?.trim()),
    ).toEqual(['09:00', '09:30']);
  });

  it('allows a derived availability slot to be selected', () => {
    selectDentist('dentist-123');
    selectDate('2026-10-05');

    const element = fixture.nativeElement as HTMLElement;

    const slots = element.querySelectorAll<HTMLButtonElement>(
      '[data-available-slot]',
    );

    expect(slots.length).toBe(2);

    slots[0].click();
    fixture.detectChanges();

    expect(
      slots[0].getAttribute('aria-pressed'),
    ).toBe('true');

    expect(
      element.querySelector('[data-selected-slot]')?.textContent,
    ).toContain('09:00');
  });

  it('provides the appointment confirmation action', () => {
    const element = fixture.nativeElement as HTMLElement;

    const button = element.querySelector<HTMLButtonElement>(
      '[data-confirm-appointment]',
    );

    expect(button).not.toBeNull();
    expect(button?.textContent).toContain('Confirmar Cita');
  });

  function searchPatient(search: string): void {
    const element = fixture.nativeElement as HTMLElement;

    const input =
      element.querySelector<HTMLInputElement>(
        '#patient-search',
      );

    expect(input).not.toBeNull();

    if (input) {
      input.value = search;
      input.dispatchEvent(new Event('input'));
    }

    fixture.detectChanges();
  }

  function selectDentist(dentistId: string): void {
    const element = fixture.nativeElement as HTMLElement;

    const select =
      element.querySelector<HTMLSelectElement>('#dentist');

    expect(select).not.toBeNull();

    const option = document.createElement('option');
    option.value = dentistId;
    option.textContent = 'Dentist test';

    select?.append(option);

    if (select) {
      select.value = dentistId;
      select.dispatchEvent(new Event('change'));
    }

    fixture.detectChanges();
  }

  function selectDate(date: string): void {
    const element = fixture.nativeElement as HTMLElement;

    const input =
      element.querySelector<HTMLInputElement>(
        '#appointment-date',
      );

    expect(input).not.toBeNull();

    if (input) {
      input.value = date;
      input.dispatchEvent(new Event('change'));
    }

    fixture.detectChanges();
  }
});