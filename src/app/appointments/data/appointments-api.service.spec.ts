import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AppointmentsApiService } from './appointments-api.service';

describe('AppointmentsApiService', () => {
  let service: AppointmentsApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AppointmentsApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(AppointmentsApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('lists appointments using relative API routes and query parameters', () => {
    service
      .listAppointments({
        page: 2,
        limit: 20,
        patientId: 'patient-1',
        dentistId: 'dentist-1',
        from: '2026-10-06T08:00:00-05:00',
        to: '2026-10-07T08:00:00-05:00',
      })
      .subscribe();

    const request = httpTesting.expectOne((candidate) => {
      return candidate.url === '/api/v1/appointments';
    });

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('limit')).toBe('20');
    expect(request.request.params.get('patientId')).toBe('patient-1');
    expect(request.request.params.get('dentistId')).toBe('dentist-1');
    expect(request.request.params.get('from')).toBe(
      '2026-10-06T08:00:00-05:00',
    );
    expect(request.request.params.get('to')).toBe(
      '2026-10-07T08:00:00-05:00',
    );

    request.flush({
      data: [],
      meta: {
        page: 2,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    });
  });

  it('reads an appointment by id', () => {
    service.getAppointment('appointment-1').subscribe();

    const request = httpTesting.expectOne(
      '/api/v1/appointments/appointment-1',
    );

    expect(request.request.method).toBe('GET');

    request.flush({});
  });

  it('creates an appointment with an idempotency key', () => {
    const body = {
      patientId: 'patient-1',
      dentistId: 'dentist-1',
      startAt: '2026-10-06T08:00:00-05:00',
      endAt: '2026-10-06T09:00:00-05:00',
      reason: 'Control',
    };

    service
      .createAppointment(
        body,
        '550e8400-e29b-41d4-a716-446655440000',
      )
      .subscribe();

    const request = httpTesting.expectOne('/api/v1/appointments');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(body);
    expect(request.request.headers.get('Idempotency-Key')).toBe(
      '550e8400-e29b-41d4-a716-446655440000',
    );

    request.flush({});
  });

  it('confirms an appointment with an idempotency key', () => {
    const body = {
      expectedVersion: 1,
      channel: 'PHONE' as const,
    };

    service
      .confirmAppointment(
        'appointment-1',
        body,
        '550e8400-e29b-41d4-a716-446655440001',
      )
      .subscribe();

    const request = httpTesting.expectOne(
      '/api/v1/appointments/appointment-1/confirmations',
    );

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(body);
    expect(request.request.headers.get('Idempotency-Key')).toBe(
      '550e8400-e29b-41d4-a716-446655440001',
    );

    request.flush({});
  });

  it('cancels an appointment with an idempotency key', () => {
    const body = {
      expectedVersion: 1,
      reason: 'Patient request',
    };

    service
      .cancelAppointment(
        'appointment-1',
        body,
        '550e8400-e29b-41d4-a716-446655440002',
      )
      .subscribe();

    const request = httpTesting.expectOne(
      '/api/v1/appointments/appointment-1/cancellations',
    );

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(body);
    expect(request.request.headers.get('Idempotency-Key')).toBe(
      '550e8400-e29b-41d4-a716-446655440002',
    );

    request.flush({});
  });

  it('reschedules an appointment with an idempotency key', () => {
    const body = {
      expectedVersion: 1,
      startAt: '2026-10-07T08:00:00-05:00',
      endAt: '2026-10-07T09:00:00-05:00',
      reason: 'Patient request',
    };

    service
      .rescheduleAppointment(
        'appointment-1',
        body,
        '550e8400-e29b-41d4-a716-446655440003',
      )
      .subscribe();

    const request = httpTesting.expectOne(
      '/api/v1/appointments/appointment-1/reschedulings',
    );

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(body);
    expect(request.request.headers.get('Idempotency-Key')).toBe(
      '550e8400-e29b-41d4-a716-446655440003',
    );

    request.flush({});
  });

  it('starts appointment attention with an idempotency key', () => {
    const body = {
      expectedVersion: 1,
    };

    service
      .startAttention(
        'appointment-1',
        body,
        '550e8400-e29b-41d4-a716-446655440004',
      )
      .subscribe();

    const request = httpTesting.expectOne(
      '/api/v1/appointments/appointment-1/attention-starts',
    );

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(body);
    expect(request.request.headers.get('Idempotency-Key')).toBe(
      '550e8400-e29b-41d4-a716-446655440004',
    );

    request.flush({});
  });

  it('marks an appointment as no-show with an idempotency key', () => {
    const body = {
      expectedVersion: 1,
      reason: 'Patient did not attend',
    };

    service
      .markNoShow(
        'appointment-1',
        body,
        '550e8400-e29b-41d4-a716-446655440005',
      )
      .subscribe();

    const request = httpTesting.expectOne(
      '/api/v1/appointments/appointment-1/no-shows',
    );

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(body);
    expect(request.request.headers.get('Idempotency-Key')).toBe(
      '550e8400-e29b-41d4-a716-446655440005',
    );

    request.flush({});
  });

  it('completes an appointment with an idempotency key', () => {
    const body = {
      expectedVersion: 1,
    };

    service
      .completeAppointment(
        'appointment-1',
        body,
        '550e8400-e29b-41d4-a716-446655440006',
      )
      .subscribe();

    const request = httpTesting.expectOne(
      '/api/v1/appointments/appointment-1/completions',
    );

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(body);
    expect(request.request.headers.get('Idempotency-Key')).toBe(
      '550e8400-e29b-41d4-a716-446655440006',
    );

    request.flush({});
  });

  it('posts the public confirmation token without an idempotency header', () => {
    const body = {
      token: 'signed-token',
    };

    service.confirmPublicAppointment(body).subscribe();

    const request = httpTesting.expectOne(
      '/api/v1/appointment-confirmations',
    );

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(body);
    expect(request.request.headers.has('Idempotency-Key')).toBe(false);

    request.flush({
      confirmed: true,
    });
  });

  it('reads dentist availability', () => {
    service.getDentistAvailability('dentist-1').subscribe();

    const request = httpTesting.expectOne(
      '/api/v1/dentists/dentist-1/availability',
    );

    expect(request.request.method).toBe('GET');

    request.flush({});
  });

  it('updates dentist availability', () => {
    const body = {
      intervals: [
        {
          startAt: '2026-10-06T08:00:00-05:00',
          endAt: '2026-10-06T12:00:00-05:00',
        },
      ],
      blockedIntervals: [],
      expectedVersion: 1,
    };

    service.updateDentistAvailability('dentist-1', body).subscribe();

    const request = httpTesting.expectOne(
      '/api/v1/dentists/dentist-1/availability',
    );

    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(body);

    request.flush({});
  });

  it('lists clinical assignments with filters', () => {
    service
      .listClinicalAssignments({
        page: 1,
        limit: 20,
        patientId: 'patient-1',
        dentistId: 'dentist-1',
      })
      .subscribe();

    const request = httpTesting.expectOne((candidate) => {
      return candidate.url === '/api/v1/clinical-assignments';
    });

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('limit')).toBe('20');
    expect(request.request.params.get('patientId')).toBe('patient-1');
    expect(request.request.params.get('dentistId')).toBe('dentist-1');

    request.flush({
      data: [],
      meta: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    });
  });

  it('reads a clinical assignment', () => {
    service.getClinicalAssignment('assignment-1').subscribe();

    const request = httpTesting.expectOne(
      '/api/v1/clinical-assignments/assignment-1',
    );

    expect(request.request.method).toBe('GET');

    request.flush({});
  });

  it('creates a clinical assignment with an idempotency key', () => {
    const body = {
      patientId: 'patient-1',
      dentistId: 'dentist-1',
      reason: 'Ongoing care',
    };

    service
      .createClinicalAssignment(
        body,
        '550e8400-e29b-41d4-a716-446655440007',
      )
      .subscribe();

    const request = httpTesting.expectOne(
      '/api/v1/clinical-assignments',
    );

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(body);
    expect(request.request.headers.get('Idempotency-Key')).toBe(
      '550e8400-e29b-41d4-a716-446655440007',
    );

    request.flush({});
  });

  it('ends a clinical assignment with an idempotency key', () => {
    const body = {
      reason: 'Care relationship ended',
      expectedVersion: 1,
    };

    service
      .endClinicalAssignment(
        'assignment-1',
        body,
        '550e8400-e29b-41d4-a716-446655440008',
      )
      .subscribe();

    const request = httpTesting.expectOne(
      '/api/v1/clinical-assignments/assignment-1/endings',
    );

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(body);
    expect(request.request.headers.get('Idempotency-Key')).toBe(
      '550e8400-e29b-41d4-a716-446655440008',
    );

    request.flush({});
  });
});