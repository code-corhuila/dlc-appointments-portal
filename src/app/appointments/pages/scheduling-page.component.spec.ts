import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  Observable,
  Subject,
  of,
  throwError,
} from 'rxjs';

import { AppointmentsApiService } from '../data/appointments-api.service';
import { PatientsLookupService } from '../data/patients-lookup.service';
import {
  Appointment,
  CreateAppointmentRequest,
} from '../model/appointment';
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

  let appointmentCreations: Array<{
    request: CreateAppointmentRequest;
    idempotencyKey: string;
  }>;

  let appointmentCreationResponse: Observable<Appointment>;

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

  const createdAppointment: Appointment = {
    id: 'appointment-123',
    patientId: 'patient-123',
    dentistId: 'dentist-123',
    startAt: '2026-10-05T09:00:00-05:00',
    endAt: '2026-10-05T09:30:00-05:00',
    reason: 'Control general',
    status: 'PROGRAMADA',
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

    appointmentCreations = [];
    appointmentCreationResponse = of(
      createdAppointment,
    );

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
            createAppointment: (
              request: CreateAppointmentRequest,
              idempotencyKey: string,
            ) => {
              appointmentCreations.push({
                request,
                idempotencyKey,
              });

              return appointmentCreationResponse;
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

  it('shows loading feedback while patient search is pending', () => {
    const pendingPatients =
      new Subject<Page<PatientView>>();

    patientSearchResponse = pendingPatients;

    searchPatient('Ana');

    const element = fixture.nativeElement as HTMLElement;

    expect(patientSearches).toEqual([
      {
        search: 'Ana',
        status: 'ACTIVE',
      },
    ]);

    expect(
      element.querySelector('[data-patient-loading]'),
    ).not.toBeNull();
  });

  it('shows empty feedback when patient search returns no active patients', () => {
    patientSearchResponse = of({
      data: [],
      meta: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    });

    searchPatient('Paciente inexistente');

    const element = fixture.nativeElement as HTMLElement;

    expect(patientSearches).toEqual([
      {
        search: 'Paciente inexistente',
        status: 'ACTIVE',
      },
    ]);

    expect(
      element.querySelector('[data-patient-empty]'),
    ).not.toBeNull();

    expect(
      element.querySelector('[data-patient-empty]')?.textContent,
    ).toContain('No se encontraron pacientes activos');
  });

  it('shows an error and retries the patient search', () => {
    patientSearchResponse = throwError(
      () => new Error('Patients unavailable'),
    );

    searchPatient('Ana');

    const element = fixture.nativeElement as HTMLElement;

    expect(patientSearches).toEqual([
      {
        search: 'Ana',
        status: 'ACTIVE',
      },
    ]);

    expect(
      element.querySelector('[data-patient-error]'),
    ).not.toBeNull();

    expect(
      element.querySelector('[data-patient-error]')?.textContent,
    ).toContain('No fue posible buscar pacientes');

    const retryButton =
      element.querySelector<HTMLButtonElement>(
        '[data-patient-retry]',
      );

    expect(retryButton).not.toBeNull();
    expect(retryButton?.textContent).toContain('Reintentar');

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

    retryButton?.click();
    fixture.detectChanges();

    expect(patientSearches).toEqual([
      {
        search: 'Ana',
        status: 'ACTIVE',
      },
      {
        search: 'Ana',
        status: 'ACTIVE',
      },
    ]);

    expect(
      element.querySelector('[data-patient-error]'),
    ).toBeNull();

    expect(
      element.querySelector('[data-patient-result]')?.textContent,
    ).toContain('Ana Torres');
  });

  it('ignores a stale patient search response after a newer search starts', () => {
    const firstSearch =
      new Subject<Page<PatientView>>();

    const secondSearch =
      new Subject<Page<PatientView>>();

    patientSearchResponse = firstSearch;

    searchPatient('Ana');

    patientSearchResponse = secondSearch;

    searchPatient('Beatriz');

    firstSearch.next({
      data: [
        {
          id: 'patient-123',
          name: 'Ana Torres',
          status: 'ACTIVE',
          version: 1,
          documentType: 'CC',
          documentNumber: '123456789',
        },
      ],
      meta: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    });

    firstSearch.complete();
    fixture.detectChanges();

    const element =
      fixture.nativeElement as HTMLElement;

    expect(patientSearches).toEqual([
      {
        search: 'Ana',
        status: 'ACTIVE',
      },
      {
        search: 'Beatriz',
        status: 'ACTIVE',
      },
    ]);

    expect(
      element.querySelectorAll('[data-patient-result]').length,
    ).toBe(0);

    expect(
      element.querySelector('[data-patient-loading]'),
    ).not.toBeNull();

    secondSearch.next({
      data: [
        {
          id: 'patient-456',
          name: 'Beatriz Gómez',
          status: 'ACTIVE',
          version: 1,
          documentType: 'CC',
          documentNumber: '987654321',
        },
      ],
      meta: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    });

    secondSearch.complete();
    fixture.detectChanges();

    const result = element.querySelector(
      '[data-patient-result]',
    );

    expect(result?.textContent)
      .toContain('Beatriz Gómez');

    expect(result?.textContent)
      .not.toContain('Ana Torres');

    expect(
      element.querySelector('[data-patient-loading]'),
    ).toBeNull();
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

  it('creates an appointment from the selected patient dentist slot and reason', () => {
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

    const element =
      fixture.nativeElement as HTMLElement;

    const patientResult =
      element.querySelector<HTMLButtonElement>(
        '[data-patient-result]',
      );

    expect(patientResult).not.toBeNull();

    patientResult?.click();
    fixture.detectChanges();

    selectDentist('dentist-123');
    selectDate('2026-10-05');

    const firstSlot =
      element.querySelector<HTMLButtonElement>(
        '[data-available-slot]',
      );

    expect(firstSlot).not.toBeNull();

    firstSlot?.click();
    fixture.detectChanges();

    const reason =
      element.querySelector<HTMLTextAreaElement>(
        '#reason',
      );

    expect(reason).not.toBeNull();

    if (reason) {
      reason.value = 'Control general';
      reason.dispatchEvent(
        new Event('input'),
      );
    }

    fixture.detectChanges();

    const confirmButton =
      element.querySelector<HTMLButtonElement>(
        '[data-confirm-appointment]',
      );

    expect(confirmButton).not.toBeNull();

    confirmButton?.click();
    fixture.detectChanges();

    expect(appointmentCreations).toHaveLength(1);

    expect(
      appointmentCreations[0]?.request,
    ).toEqual({
      patientId: 'patient-123',
      dentistId: 'dentist-123',
      startAt:
        '2026-10-05T09:00:00-05:00',
      endAt:
        '2026-10-05T09:30:00-05:00',
      reason: 'Control general',
    });

    expect(
      appointmentCreations[0]?.idempotencyKey,
    ).toEqual(expect.any(String));

    expect(
      appointmentCreations[0]?.idempotencyKey.length,
    ).toBeGreaterThan(0);
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
    const firstRequest =
      new Subject<DentistAvailability>();

    const secondRequest =
      new Subject<DentistAvailability>();

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

    const element =
      fixture.nativeElement as HTMLElement;

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
      slots.map(
        (slot) =>
          slot.textContent?.trim(),
      ),
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
      slots.map(
        (slot) =>
          slot.textContent?.trim(),
      ),
    ).toEqual(['09:00', '09:30']);
  });

  it('allows a derived availability slot to be selected', () => {
    selectDentist('dentist-123');
    selectDate('2026-10-05');

    const element = fixture.nativeElement as HTMLElement;

    const slots =
      element.querySelectorAll<HTMLButtonElement>(
        '[data-available-slot]',
      );

    expect(slots.length).toBe(2);

    slots[0].click();
    fixture.detectChanges();

    expect(
      slots[0].getAttribute(
        'aria-pressed',
      ),
    ).toBe('true');

    expect(
      element.querySelector('[data-selected-slot]')?.textContent,
    ).toContain('09:00');
  });

  it('provides the appointment confirmation action', () => {
    const element = fixture.nativeElement as HTMLElement;

    const button =
      element.querySelector<HTMLButtonElement>(
        '[data-confirm-appointment]',
      );

    expect(button).not.toBeNull();

    expect(
      button?.textContent,
    ).toContain('Confirmar Cita');
  });

  function searchPatient(
    search: string,
  ): void {
    const element =
      fixture.nativeElement as HTMLElement;

    const input =
      element.querySelector<HTMLInputElement>(
        '#patient-search',
      );

    expect(input).not.toBeNull();

    if (input) {
      input.value = search;

      input.dispatchEvent(
        new Event('input'),
      );
    }

    fixture.detectChanges();
  }

  function selectDentist(
    dentistId: string,
  ): void {
    const element =
      fixture.nativeElement as HTMLElement;

    const select =
      element.querySelector<HTMLSelectElement>(
        '#dentist',
      );

    expect(select).not.toBeNull();

    const option =
      document.createElement('option');

    option.value = dentistId;
    option.textContent = 'Dentist test';

    select?.append(option);

    if (select) {
      select.value = dentistId;

      select.dispatchEvent(
        new Event('change'),
      );
    }

    fixture.detectChanges();
  }

  function selectDate(
    date: string,
  ): void {
    const element =
      fixture.nativeElement as HTMLElement;

    const input =
      element.querySelector<HTMLInputElement>(
        '#appointment-date',
      );

    expect(input).not.toBeNull();

    if (input) {
      input.value = date;

      input.dispatchEvent(
        new Event('change'),
      );
    }

    fixture.detectChanges();
  }
});