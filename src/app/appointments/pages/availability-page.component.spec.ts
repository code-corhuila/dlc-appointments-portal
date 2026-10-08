import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  finalize,
  Observable,
  of,
  Subject,
  throwError,
} from 'rxjs';

import { AppointmentsApiService } from '../data/appointments-api.service';
import { ApiError } from '../model/api-error';
import {
  DentistAvailability,
  UpdateDentistAvailabilityRequest,
} from '../model/availability';
import { AvailabilityPageComponent } from './availability-page.component';

describe('AvailabilityPageComponent', () => {
  let fixture: ComponentFixture<AvailabilityPageComponent>;
  let requestedDentistIds: string[];
  let availabilityResponse$: Observable<DentistAvailability>;

  let updatedAvailabilityRequests: Array<{
    dentistId: string;
    request: UpdateDentistAvailabilityRequest;
  }>;

  let updateAvailabilityResponseFactory: (
    dentistId: string,
    request: UpdateDentistAvailabilityRequest,
  ) => Observable<DentistAvailability>;

  const availability: DentistAvailability = {
    id: 'availability-123',
    dentistId: 'dentist-123',
    intervals: [],
    blockedIntervals: [],
    version: 1,
  };

  beforeEach(async () => {
    requestedDentistIds = [];
    updatedAvailabilityRequests = [];
    availabilityResponse$ = of(availability);

    updateAvailabilityResponseFactory = (
      dentistId,
      request,
    ) =>
      of({
        ...availability,
        dentistId,
        intervals: request.intervals,
        blockedIntervals: request.blockedIntervals,
        version: request.expectedVersion + 1,
      });

    const api = {
      getDentistAvailability: (dentistId: string) => {
        requestedDentistIds.push(dentistId);
        return availabilityResponse$;
      },

      updateDentistAvailability: (
        dentistId: string,
        request: UpdateDentistAvailabilityRequest,
      ) => {
        updatedAvailabilityRequests.push({
          dentistId,
          request,
        });

        return updateAvailabilityResponseFactory(
          dentistId,
          request,
        );
      },
    } as Pick<
      AppointmentsApiService,
      | 'getDentistAvailability'
      | 'updateDentistAvailability'
    >;

    await TestBed.configureTestingModule({
      imports: [AvailabilityPageComponent],
      providers: [
        {
          provide: AppointmentsApiService,
          useValue: api,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(
      AvailabilityPageComponent,
    );

    fixture.detectChanges();
  });

  it('renders the availability view', () => {
    const element =
      fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain(
      'Horarios y Slots de Disponibilidad',
    );
  });

  it('provides the main availability controls', () => {
    const element =
      fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector(
        '[data-dentist-select]',
      ),
    ).not.toBeNull();

    expect(
      element.querySelector(
        '[data-weekly-schedule]',
      ),
    ).not.toBeNull();

    expect(
      element.querySelector(
        '[data-generate-slots]',
      ),
    ).not.toBeNull();
  });

  it('loads availability when a dentist is selected', () => {
    selectDentist('dentist-123');

    expect(requestedDentistIds).toEqual([
      'dentist-123',
    ]);
  });

  it('renders loaded availability interval in the weekly schedule', () => {
    availabilityResponse$ = of({
      ...availability,
      intervals: [
        {
          startAt: '2026-10-05T09:30:00-05:00',
          endAt: '2026-10-05T11:30:00-05:00',
        },
      ],
    });

    selectDentist('dentist-123');

    const element =
      fixture.nativeElement as HTMLElement;

    const monday =
      element.querySelector(
        '[data-day="monday"]',
      ) as HTMLElement;

    const start =
      monday.querySelector<HTMLInputElement>(
        '[data-shift-one-start]',
      );

    const end =
      monday.querySelector<HTMLInputElement>(
        '[data-shift-one-end]',
      );

    expect(start?.value).toBe('09:30');
    expect(end?.value).toBe('11:30');
  });

  it('renders UTC availability using the clinic local weekday and time', () => {
    availabilityResponse$ = of({
      ...availability,
      intervals: [
        {
          startAt: '2026-10-06T02:30:00Z',
          endAt: '2026-10-06T03:30:00Z',
        },
      ],
    });

    selectDentist('dentist-123');

    const element =
      fixture.nativeElement as HTMLElement;

    const monday =
      element.querySelector(
        '[data-day="monday"]',
      ) as HTMLElement;

    const tuesday =
      element.querySelector(
        '[data-day="tuesday"]',
      ) as HTMLElement;

    const mondayEnabled =
      monday.querySelector<HTMLInputElement>(
        'input[type="checkbox"]',
      );

    const mondayStart =
      monday.querySelector<HTMLInputElement>(
        '[data-shift-one-start]',
      );

    const mondayEnd =
      monday.querySelector<HTMLInputElement>(
        '[data-shift-one-end]',
      );

    const tuesdayEnabled =
      tuesday.querySelector<HTMLInputElement>(
        'input[type="checkbox"]',
      );

    expect(mondayEnabled?.checked).toBe(true);
    expect(mondayStart?.value).toBe('21:30');
    expect(mondayEnd?.value).toBe('22:30');

    expect(tuesdayEnabled?.checked).toBe(false);
  });

  it('saves loaded dentist availability with the current version', () => {
    const loadedAvailability: DentistAvailability = {
      ...availability,
      intervals: [
        {
          startAt: '2026-10-05T09:30:00-05:00',
          endAt: '2026-10-05T11:30:00-05:00',
        },
      ],
      blockedIntervals: [
        {
          startAt: '2026-10-05T12:00:00-05:00',
          endAt: '2026-10-05T13:00:00-05:00',
        },
      ],
      version: 7,
    };

    availabilityResponse$ = of(
      loadedAvailability,
    );

    selectDentist('dentist-123');

    const element =
      fixture.nativeElement as HTMLElement;

    const saveButton =
      element.querySelector<HTMLButtonElement>(
        '[data-save-availability]',
      );

    expect(saveButton).not.toBeNull();

    saveButton?.click();
    fixture.detectChanges();

    expect(updatedAvailabilityRequests).toEqual([
      {
        dentistId: 'dentist-123',
        request: {
          intervals:
            loadedAvailability.intervals,
          blockedIntervals:
            loadedAvailability.blockedIntervals,
          expectedVersion: 7,
        },
      },
    ]);
  });

  it('disables save while availability update is pending', () => {
    const updateResponse =
      new Subject<DentistAvailability>();

    updateAvailabilityResponseFactory = () =>
      updateResponse;

    availabilityResponse$ = of({
      ...availability,
      version: 4,
    });

    selectDentist('dentist-123');

    const element =
      fixture.nativeElement as HTMLElement;

    const saveButton =
      element.querySelector<HTMLButtonElement>(
        '[data-save-availability]',
      );

    expect(saveButton).not.toBeNull();
    expect(saveButton?.disabled).toBe(false);

    saveButton?.click();
    fixture.detectChanges();

    expect(updatedAvailabilityRequests).toHaveLength(
      1,
    );

    expect(saveButton?.disabled).toBe(true);
  });

  it('shows stale version error when availability changed before save', () => {
    const staleVersionError: ApiError = {
      error: 'STALE_VERSION',
      message:
        'Availability was modified by another user.',
      traceId: 'trace-stale-version-001',
    };

    updateAvailabilityResponseFactory = () =>
      throwError(() => staleVersionError);

    availabilityResponse$ = of({
      ...availability,
      version: 8,
    });

    selectDentist('dentist-123');

    const element =
      fixture.nativeElement as HTMLElement;

    const saveButton =
      element.querySelector<HTMLButtonElement>(
        '[data-save-availability]',
      );

    saveButton?.click();
    fixture.detectChanges();

    const saveError =
      element.querySelector(
        '[data-availability-save-error]',
      );

    expect(saveError).not.toBeNull();

    expect(saveError?.textContent).toContain(
      'Availability was modified by another user.',
    );

    expect(saveButton?.disabled).toBe(false);
  });

  it('saves edited shift time using the clinic local date', () => {
    const loadedAvailability: DentistAvailability = {
      ...availability,
      intervals: [
        {
          startAt: '2026-10-06T02:30:00Z',
          endAt: '2026-10-06T03:30:00Z',
        },
      ],
      version: 4,
    };

    availabilityResponse$ = of(
      loadedAvailability,
    );

    selectDentist('dentist-123');

    const element =
      fixture.nativeElement as HTMLElement;

    const monday =
      element.querySelector(
        '[data-day="monday"]',
      ) as HTMLElement;

    const start =
      monday.querySelector<HTMLInputElement>(
        '[data-shift-one-start]',
      );

    expect(start?.value).toBe('21:30');

    if (start) {
      start.value = '20:30';

      start.dispatchEvent(
        new Event('change'),
      );
    }

    fixture.detectChanges();

    const saveButton =
      element.querySelector<HTMLButtonElement>(
        '[data-save-availability]',
      );

    saveButton?.click();
    fixture.detectChanges();

    expect(updatedAvailabilityRequests).toEqual([
      {
        dentistId: 'dentist-123',
        request: {
          intervals: [
            {
              startAt:
                '2026-10-05T20:30:00-05:00',
              endAt:
                '2026-10-06T03:30:00Z',
            },
          ],
          blockedIntervals: [],
          expectedVersion: 4,
        },
      },
    ]);
  });

  it('shows loading and cancels the previous dentist request', () => {
    const firstResponse =
      new Subject<DentistAvailability>();

    let firstRequestCancelled = false;

    availabilityResponse$ = firstResponse.pipe(
      finalize(() => {
        firstRequestCancelled = true;
      }),
    );

    selectDentist('dentist-123');

    const element =
      fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector(
        '[data-availability-loading]',
      ),
    ).not.toBeNull();

    availabilityResponse$ =
      new Subject<DentistAvailability>();

    selectDentist('dentist-456');

    expect(firstRequestCancelled).toBe(true);

    expect(requestedDentistIds).toEqual([
      'dentist-123',
      'dentist-456',
    ]);
  });

  it('shows empty state when dentist has no availability intervals', () => {
    selectDentist('dentist-123');

    const element =
      fixture.nativeElement as HTMLElement;

    fixture.detectChanges();

    const emptyState =
      element.querySelector(
        '[data-availability-empty]',
      );

    expect(emptyState).not.toBeNull();

    expect(emptyState?.textContent).toContain(
      'No hay disponibilidad configurada para este odontólogo.',
    );
  });

  it('shows an error and retries the selected dentist availability', () => {
    const apiError: ApiError = {
      error: 'SERVICE_UNAVAILABLE',
      message: 'Availability is temporarily unavailable.',
      traceId: 'trace-availability-001',
    };

    availabilityResponse$ =
      throwError(() => apiError);

    selectDentist('dentist-123');

    const element =
      fixture.nativeElement as HTMLElement;

    fixture.detectChanges();

    const errorState =
      element.querySelector(
        '[data-availability-error]',
      );

    const retryButton =
      element.querySelector<HTMLButtonElement>(
        '[data-availability-retry]',
      );

    expect(errorState).not.toBeNull();

    expect(errorState?.textContent).toContain(
      'Availability is temporarily unavailable.',
    );

    expect(retryButton).not.toBeNull();

    retryButton?.click();
    fixture.detectChanges();

    expect(requestedDentistIds).toEqual([
      'dentist-123',
      'dentist-123',
    ]);
  });

  it('disables monday schedule fields when monday is disabled', () => {
    const element =
      fixture.nativeElement as HTMLElement;

    const monday =
      element.querySelector(
        '[data-day="monday"]',
      ) as HTMLElement;

    const enabled =
      monday.querySelector(
        'input[type="checkbox"]',
      ) as HTMLInputElement;

    const controls = Array.from(
      monday.querySelectorAll(
        'input[type="time"], select',
      ),
    ) as Array<
      HTMLInputElement | HTMLSelectElement
    >;

    expect(enabled.checked).toBe(true);

    expect(
      controls.every(
        (control) => !control.disabled,
      ),
    ).toBe(true);

    enabled.click();
    fixture.detectChanges();

    expect(enabled.checked).toBe(false);

    expect(
      controls.every(
        (control) => control.disabled,
      ),
    ).toBe(true);
  });

  it('shows the generated slots empty state', () => {
    const element =
      fixture.nativeElement as HTMLElement;

    const emptyState =
      element.querySelector(
        '[data-slots-empty]',
      );

    expect(emptyState?.textContent).toContain(
      'No hay slots generados.',
    );
  });

  function selectDentist(dentistId: string): void {
    const element =
      fixture.nativeElement as HTMLElement;

    const select =
      element.querySelector<HTMLSelectElement>(
        '[data-dentist-select]',
      );

    expect(select).not.toBeNull();

    const dentistOption =
      document.createElement('option');

    dentistOption.value = dentistId;
    dentistOption.textContent = 'Dentist test';

    select?.append(dentistOption);

    if (select) {
      select.value = dentistId;

      select.dispatchEvent(
        new Event('change'),
      );
    }

    fixture.detectChanges();
  }
});