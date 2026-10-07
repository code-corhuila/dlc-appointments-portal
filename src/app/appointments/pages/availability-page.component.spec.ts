import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AppointmentsApiService } from '../data/appointments-api.service';
import { DentistAvailability } from '../model/availability';
import { AvailabilityPageComponent } from './availability-page.component';

describe('AvailabilityPageComponent', () => {
  let fixture: ComponentFixture<AvailabilityPageComponent>;
  let requestedDentistIds: string[];

  const availability: DentistAvailability = {
    id: 'availability-123',
    dentistId: 'dentist-123',
    intervals: [],
    blockedIntervals: [],
    version: 1,
  };

  beforeEach(async () => {
    requestedDentistIds = [];

    const api = {
      getDentistAvailability: (dentistId: string) => {
        requestedDentistIds.push(dentistId);
        return of(availability);
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
    const element =
      fixture.nativeElement as HTMLElement;

    const select =
      element.querySelector<HTMLSelectElement>(
        '[data-dentist-select]',
      );

    expect(select).not.toBeNull();

    const dentistOption =
      document.createElement('option');

    dentistOption.value = 'dentist-123';
    dentistOption.textContent = 'Dentist test';

    select?.append(dentistOption);

    if (select) {
      select.value = 'dentist-123';

      select.dispatchEvent(
        new Event('change'),
      );
    }

    fixture.detectChanges();

    expect(requestedDentistIds).toEqual([
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
});