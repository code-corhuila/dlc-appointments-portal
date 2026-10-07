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
import { DentistAvailability } from '../model/availability';
import { AvailabilityPageComponent } from './availability-page.component';

describe('AvailabilityPageComponent', () => {
  let fixture: ComponentFixture<AvailabilityPageComponent>;
  let requestedDentistIds: string[];
  let availabilityResponse$: Observable<DentistAvailability>;

  const availability: DentistAvailability = {
    id: 'availability-123',
    dentistId: 'dentist-123',
    intervals: [],
    blockedIntervals: [],
    version: 1,
  };

  beforeEach(async () => {
    requestedDentistIds = [];
    availabilityResponse$ = of(availability);

    const api = {
      getDentistAvailability: (dentistId: string) => {
        requestedDentistIds.push(dentistId);
        return availabilityResponse$;
      },
    } as Pick<
      AppointmentsApiService,
      'getDentistAvailability'
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