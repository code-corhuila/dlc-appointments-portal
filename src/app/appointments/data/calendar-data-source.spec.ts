import {
  finalize,
  of,
  Subject,
  throwError,
} from 'rxjs';

import { AppointmentsApiService } from './appointments-api.service';
import {
  CalendarDataSource,
  type CalendarSelection,
} from './calendar-data-source';
import { ApiError } from '../model/api-error';
import { Appointment } from '../model/appointment';
import { AppointmentListQuery } from '../model/appointment-operations';
import { Page } from '../model/page';

describe('CalendarDataSource', () => {
  const emptyPage: Page<Appointment> = {
    data: [],
    meta: {
      page: 1,
      limit: 100,
      total: 0,
      totalPages: 0,
    },
  };

  it('builds the appointment query from the calendar selection', () => {
    const requests: AppointmentListQuery[] = [];

    const api = {
      listAppointments: (query: AppointmentListQuery) => {
        requests.push(query);
        return of(emptyPage);
      },
    } as Pick<AppointmentsApiService, 'listAppointments'>;

    const selection$ = new Subject<CalendarSelection>();
    const dataSource = new CalendarDataSource(api);

    dataSource.connect(selection$).subscribe();

    selection$.next({
      anchorDate: '2026-10-15',
      view: 'month',
      dentistId: 'dentist-123',
    });

    expect(requests).toEqual([
      {
        page: 1,
        limit: 100,
        dentistId: 'dentist-123',
        from: '2026-10-01T00:00:00-05:00',
        to: '2026-11-01T00:00:00-05:00',
      },
    ]);
  });

  it('cancels the previous request when the selection changes', () => {
    const firstResponse = new Subject<Page<Appointment>>();
    const secondResponse = new Subject<Page<Appointment>>();

    let requestCount = 0;
    let firstRequestFinalized = false;

    const api = {
      listAppointments: () => {
        requestCount += 1;

        if (requestCount === 1) {
          return firstResponse.pipe(
            finalize(() => {
              firstRequestFinalized = true;
            }),
          );
        }

        return secondResponse;
      },
    } as Pick<AppointmentsApiService, 'listAppointments'>;

    const selection$ = new Subject<CalendarSelection>();
    const dataSource = new CalendarDataSource(api);

    dataSource.connect(selection$).subscribe();

    selection$.next({
      anchorDate: '2026-10-06',
      view: 'week',
    });

    expect(firstRequestFinalized).toBe(false);

    selection$.next({
      anchorDate: '2026-10-13',
      view: 'week',
    });

    expect(firstRequestFinalized).toBe(true);
    expect(requestCount).toBe(2);
  });

  it('reports a request error and keeps listening for later selections', () => {
    const apiError: ApiError = {
      error: 'SERVICE_UNAVAILABLE',
      message: 'Appointments are temporarily unavailable.',
      traceId: 'trace-calendar-001',
    };

    let requestCount = 0;

    const api = {
      listAppointments: () => {
        requestCount += 1;

        if (requestCount === 1) {
          return throwError(() => apiError);
        }

        return of(emptyPage);
      },
    } as Pick<AppointmentsApiService, 'listAppointments'>;

    const selection$ = new Subject<CalendarSelection>();
    const dataSource = new CalendarDataSource(api);
    const reportedErrors: ApiError[] = [];
    const emittedPages: Page<Appointment>[] = [];

    dataSource.errors$.subscribe((error) => {
      reportedErrors.push(error);
    });

    dataSource.connect(selection$).subscribe((page) => {
      emittedPages.push(page);
    });

    selection$.next({
      anchorDate: '2026-10-06',
      view: 'week',
      dentistId: 'dentist-123',
    });

    expect(reportedErrors).toEqual([apiError]);
    expect(requestCount).toBe(1);

    selection$.next({
      anchorDate: '2026-10-13',
      view: 'week',
      dentistId: 'dentist-123',
    });

    expect(requestCount).toBe(2);
    expect(emittedPages).toEqual([emptyPage]);
  });

  it('loads every page when the calendar range has more than 100 appointments', () => {
    const later = createAppointment(
      'later',
      '2026-10-20T15:00:00-05:00',
    );

    const earlier = createAppointment(
      'earlier',
      '2026-10-03T09:00:00-05:00',
    );

    const requests: AppointmentListQuery[] = [];

    const api = {
      listAppointments: (query: AppointmentListQuery) => {
        requests.push(query);

        if (query.page === 1) {
          return of<Page<Appointment>>({
            data: [later],
            meta: {
              page: 1,
              limit: 100,
              total: 101,
              totalPages: 2,
            },
          });
        }

        return of<Page<Appointment>>({
          data: [earlier],
          meta: {
            page: 2,
            limit: 100,
            total: 101,
            totalPages: 2,
          },
        });
      },
    } as Pick<AppointmentsApiService, 'listAppointments'>;

    const selection$ = new Subject<CalendarSelection>();
    const dataSource = new CalendarDataSource(api);

    let result: Page<Appointment> | undefined;

    dataSource.connect(selection$).subscribe((page) => {
      result = page;
    });

    selection$.next({
      anchorDate: '2026-10-15',
      view: 'month',
      dentistId: 'dentist-123',
    });

    expect(requests).toEqual([
      {
        page: 1,
        limit: 100,
        dentistId: 'dentist-123',
        from: '2026-10-01T00:00:00-05:00',
        to: '2026-11-01T00:00:00-05:00',
      },
      {
        page: 2,
        limit: 100,
        dentistId: 'dentist-123',
        from: '2026-10-01T00:00:00-05:00',
        to: '2026-11-01T00:00:00-05:00',
      },
    ]);

    expect(result?.data.map((appointment) => appointment.id)).toEqual([
      'earlier',
      'later',
    ]);

    expect(result?.meta).toEqual({
      page: 1,
      limit: 100,
      total: 101,
      totalPages: 2,
    });
  });

  it('orders appointments by start time', () => {
    const later = createAppointment(
      'later',
      '2026-10-15T15:00:00-05:00',
    );

    const earlier = createAppointment(
      'earlier',
      '2026-10-15T09:00:00-05:00',
    );

    const api = {
      listAppointments: () =>
        of<Page<Appointment>>({
          data: [later, earlier],
          meta: {
            page: 1,
            limit: 100,
            total: 2,
            totalPages: 1,
          },
        }),
    } as Pick<AppointmentsApiService, 'listAppointments'>;

    const selection$ = new Subject<CalendarSelection>();
    const dataSource = new CalendarDataSource(api);

    let result: Page<Appointment> | undefined;

    dataSource.connect(selection$).subscribe((page) => {
      result = page;
    });

    selection$.next({
      anchorDate: '2026-10-15',
      view: 'month',
    });

    expect(result?.data.map((appointment) => appointment.id)).toEqual([
      'earlier',
      'later',
    ]);
  });
});

function createAppointment(
  id: string,
  startAt: string,
): Appointment {
  return {
    id,
    patientId: `patient-${id}`,
    dentistId: 'dentist-123',
    startAt,
    endAt: startAt,
    status: 'PROGRAMADA',
    version: 1,
  };
}