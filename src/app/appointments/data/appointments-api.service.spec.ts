import { TestBed } from '@angular/core/testing';
import { firstValueFrom, Observable } from 'rxjs';

import { SHELL_CONTEXT, ShellHttpRequest } from '../../shell-contract';
import { fakeShellContext, shellFailure, shellOk } from '../../../testing/fake-shell';
import { AppointmentsApiService } from './appointments-api.service';

describe('AppointmentsApiService', () => {
  let service: AppointmentsApiService;
  let calls: ShellHttpRequest[];

  function setup(respond?: Parameters<typeof fakeShellContext>[0]) {
    const shell = fakeShellContext(respond);
    calls = shell.calls;
    TestBed.configureTestingModule({
      providers: [{ provide: SHELL_CONTEXT, useValue: shell.context }],
    });
    service = TestBed.inject(AppointmentsApiService);
  }

  beforeEach(() => setup());

  const send = (call: Observable<unknown>) => firstValueFrom(call);

  it('lists appointments through the shell with contract query parameters', async () => {
    await send(
      service.listAppointments({
        page: 2,
        limit: 20,
        patientId: 'patient-1',
        dentistId: 'dentist-1',
        from: '2026-10-06T08:00:00-05:00',
        to: '2026-10-07T08:00:00-05:00',
      }),
    );

    expect(calls[0]).toMatchObject({
      method: 'GET',
      path: '/api/v1/appointments',
      query: {
        page: ['2'],
        limit: ['20'],
        patientId: ['patient-1'],
        dentistId: ['dentist-1'],
        from: ['2026-10-06T08:00:00-05:00'],
        to: ['2026-10-07T08:00:00-05:00'],
      },
    });
    expect(calls[0].body).toBeUndefined();
  });

  it('emits the page returned by the API', async () => {
    const page = { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };
    TestBed.resetTestingModule();
    setup(() => shellOk(page));

    await expect(send(service.listAppointments())).resolves.toEqual(page);
  });

  it('reads one appointment and encodes its id', async () => {
    await send(service.getAppointment('a/1'));

    expect(calls[0]).toMatchObject({ method: 'GET', path: '/api/v1/appointments/a%2F1' });
  });

  const KEY = '550e8400-e29b-41d4-a716-446655440000';
  const commands: ReadonlyArray<[string, (s: AppointmentsApiService) => Observable<unknown>, string, unknown]> = [
    [
      'schedules',
      (s) => s.createAppointment(
        { patientId: 'p-1', dentistId: 'd-1', startAt: '2026-10-06T08:00:00-05:00', endAt: '2026-10-06T09:00:00-05:00', reason: 'Control' },
        KEY,
      ),
      '/api/v1/appointments',
      { patientId: 'p-1', dentistId: 'd-1', startAt: '2026-10-06T08:00:00-05:00', endAt: '2026-10-06T09:00:00-05:00', reason: 'Control' },
    ],
    ['confirms', (s) => s.confirmAppointment('a-1', { expectedVersion: 1, channel: 'PHONE' }, KEY), '/api/v1/appointments/a-1/confirmations', { expectedVersion: 1, channel: 'PHONE' }],
    ['cancels', (s) => s.cancelAppointment('a-1', { expectedVersion: 1, reason: 'Patient request' }, KEY), '/api/v1/appointments/a-1/cancellations', { expectedVersion: 1, reason: 'Patient request' }],
    [
      'reschedules',
      (s) => s.rescheduleAppointment('a-1', { expectedVersion: 2, startAt: '2026-10-07T08:00:00-05:00', endAt: '2026-10-07T09:00:00-05:00', reason: 'Conflict' }, KEY),
      '/api/v1/appointments/a-1/reschedulings',
      { expectedVersion: 2, startAt: '2026-10-07T08:00:00-05:00', endAt: '2026-10-07T09:00:00-05:00', reason: 'Conflict' },
    ],
    ['starts attention for', (s) => s.startAttention('a-1', { expectedVersion: 3 }, KEY), '/api/v1/appointments/a-1/attention-starts', { expectedVersion: 3 }],
    ['marks a no-show for', (s) => s.markNoShow('a-1', { expectedVersion: 3, reason: 'No contact' }, KEY), '/api/v1/appointments/a-1/no-shows', { expectedVersion: 3, reason: 'No contact' }],
    ['completes', (s) => s.completeAppointment('a-1', { expectedVersion: 4 }, KEY), '/api/v1/appointments/a-1/completions', { expectedVersion: 4 }],
    ['starts', (s) => s.createClinicalAssignment({ patientId: 'p-1', dentistId: 'd-1', reason: 'Ortodoncia' }, KEY), '/api/v1/clinical-assignments', { patientId: 'p-1', dentistId: 'd-1', reason: 'Ortodoncia' }],
    ['ends', (s) => s.endClinicalAssignment('c-1', { expectedVersion: 1, reason: 'Done' }, KEY), '/api/v1/clinical-assignments/c-1/endings', { expectedVersion: 1, reason: 'Done' }],
  ];

  for (const [verb, call, path, body] of commands) {
    it(`${verb} ${path} with its idempotency key`, async () => {
      await send(call(service));

      expect(calls[0]).toMatchObject({
        method: 'POST',
        path,
        body,
        headers: { 'Idempotency-Key': KEY },
      });
    });
  }

  it('reads and replaces dentist availability', async () => {
    const body = { expectedVersion: 1, weeklyShifts: [], exceptions: [] };

    await send(service.getDentistAvailability('d-1'));
    await send(service.updateDentistAvailability('d-1', body as never));

    expect(calls[0]).toMatchObject({ method: 'GET', path: '/api/v1/dentists/d-1/availability' });
    expect(calls[1]).toMatchObject({ method: 'PUT', path: '/api/v1/dentists/d-1/availability', body });
  });

  it('lists and reads clinical assignments', async () => {
    await send(service.listClinicalAssignments({ page: 1, limit: 20, patientId: 'p-1', dentistId: 'd-1' }));
    await send(service.getClinicalAssignment('c-1'));

    expect(calls[0]).toMatchObject({
      method: 'GET',
      path: '/api/v1/clinical-assignments',
      query: { page: ['1'], limit: ['20'], patientId: ['p-1'], dentistId: ['d-1'] },
    });
    expect(calls[1]).toMatchObject({ method: 'GET', path: '/api/v1/clinical-assignments/c-1' });
  });

  it('only calls operations published in the Appointments contract', () => {
    expect('confirmPublicAppointment' in service).toBe(false);
  });

  it('propagates the owner error envelope', async () => {
    TestBed.resetTestingModule();
    setup(() => shellFailure(409, 'APPOINTMENT_CONFLICT', { traceId: 't-2' }));

    await expect(send(service.getAppointment('a-1'))).rejects.toMatchObject({
      error: 'APPOINTMENT_CONFLICT',
      traceId: 't-2',
    });
  });
});
