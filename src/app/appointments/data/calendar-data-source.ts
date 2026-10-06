import {
  catchError,
  EMPTY,
  expand,
  map,
  Observable,
  reduce,
  Subject,
  switchMap,
} from 'rxjs';

import {
  CalendarView,
  getCalendarRange,
} from '../domain/calendar-range';
import { ApiError } from '../model/api-error';
import { Appointment } from '../model/appointment';
import { AppointmentListQuery } from '../model/appointment-operations';
import { Page } from '../model/page';
import { AppointmentsApiService } from './appointments-api.service';

export interface CalendarSelection {
  readonly anchorDate: string;
  readonly view: CalendarView;
  readonly dentistId?: string;
}

export class CalendarDataSource {
  private readonly errorSubject = new Subject<ApiError>();

  readonly errors$ = this.errorSubject.asObservable();

  constructor(
    private readonly api: Pick<
      AppointmentsApiService,
      'listAppointments'
    >,
  ) {}

  connect(
    selection$: Observable<CalendarSelection>,
  ): Observable<Page<Appointment>> {
    return selection$.pipe(
      switchMap((selection) => {
        const range = getCalendarRange(
          selection.anchorDate,
          selection.view,
        );

        const query: AppointmentListQuery = {
          page: 1,
          limit: 100,
          ...(selection.dentistId
            ? { dentistId: selection.dentistId }
            : {}),
          from: range.from,
          to: range.to,
        };

        return this.api.listAppointments(query).pipe(
          expand((page) => {
            const nextPage = page.meta.page + 1;

            if (nextPage > page.meta.totalPages) {
              return EMPTY;
            }

            return this.api.listAppointments({
              ...query,
              page: nextPage,
            });
          }),
          reduce((combined, page) => ({
            ...combined,
            data: [
              ...combined.data,
              ...page.data,
            ],
          })),
          map((page) => ({
            ...page,
            data: [...page.data].sort((left, right) =>
              left.startAt.localeCompare(right.startAt),
            ),
          })),
          catchError((error: ApiError) => {
            this.errorSubject.next(error);
            return EMPTY;
          }),
        );
      }),
    );
  }
}