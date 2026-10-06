import {
  finalize,
  of,
  Subject,
} from 'rxjs';

import { AppointmentsApiService } from './appointments-api.service';
import {
  CalendarDataSource,
  type CalendarSelection,
} from './calendar-data-source';
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