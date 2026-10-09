
import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppointmentsApiService } from '../data/appointments-api.service';
import {
  DentistAvailability,
  UpdateDentistAvailabilityRequest,
} from '../model/availability';
import { AvailabilityPageComponent } from './availability-page.component';

describe('AvailabilityPageComponent schedule controls', () => {
  let fixture: ComponentFixture<AvailabilityPageComponent>;
  let element: HTMLElement;
  let updateAvailability: ReturnType<typeof vi.fn>;

  const mondayMorning = {
    startAt: '2026-10-05T14:00:00Z',
    endAt: '2026-10-05T15:00:00Z',
  };

  const mondayAfternoon = {
    startAt: '2026-10-05T19:00:00Z',
    endAt: '2026-10-05T20:00:00Z',
  };

  const tuesdayMorning = {
    startAt: '2026-10-06T13:00:00Z',
    endAt: '2026-10-06T14:00:00Z',
  };

  const availability: DentistAvailability = {
    id: 'availability-123',
    dentistId: 'dentist-123',
    intervals: [
      mondayMorning,
      mondayAfternoon,
      tuesdayMorning,
    ],
    blockedIntervals: [],
    version: 3,
  };

  beforeEach(async () => {
    updateAvailability = vi.fn(
      (
        _dentistId: string,
        request: UpdateDentistAvailabilityRequest,
      ) =>
        of({
          ...availability,
          intervals: request.intervals,
          blockedIntervals: request.blockedIntervals,
          version: request.expectedVersion + 1,
        }),
    );

    await TestBed.configureTestingModule({
      imports: [AvailabilityPageComponent],
      providers: [
        {
          provide: AppointmentsApiService,
          useValue: {
            getDentistAvailability: () => of(availability),
            updateDentistAvailability: updateAvailability,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(
      AvailabilityPageComponent,
    );

    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();

    const dentistSelect =
      element.querySelector<HTMLSelectElement>(
        '[data-dentist-select]',
      );

    expect(dentistSelect).not.toBeNull();

    const option = document.createElement('option');
    option.value = 'dentist-123';
    option.textContent = 'Test Dentist';

    dentistSelect!.append(option);
    dentistSelect!.value = 'dentist-123';
    dentistSelect!.dispatchEvent(
      new Event('change', { bubbles: true }),
    );

    fixture.detectChanges();
  });

  function saveAvailability(): void {
    const button = element.querySelector<HTMLButtonElement>(
      '[data-availability-save]',
    );

    expect(button).not.toBeNull();
    button!.click();
    fixture.detectChanges();
  }

  it('removes disabled day intervals from the saved availability', () => {
    const mondayEnabled =
      element.querySelector<HTMLInputElement>(
        '#monday-enabled',
      );

    expect(mondayEnabled?.checked).toBe(true);

    mondayEnabled!.click();
    fixture.detectChanges();

    expect(mondayEnabled?.checked).toBe(false);

    saveAvailability();

    expect(updateAvailability).toHaveBeenCalledWith(
      'dentist-123',
      {
        intervals: [tuesdayMorning],
        blockedIntervals: [],
        expectedVersion: 3,
      },
    );
  });

  it('removes only the disabled second shift when saving', () => {
    const secondShift =
      element.querySelector<HTMLInputElement>(
        '#monday-second-shift',
      );

    expect(secondShift?.checked).toBe(true);

    secondShift!.click();
    fixture.detectChanges();

    expect(secondShift?.checked).toBe(false);

    saveAvailability();

    expect(updateAvailability).toHaveBeenCalledWith(
      'dentist-123',
      {
        intervals: [
          mondayMorning,
          tuesdayMorning,
        ],
        blockedIntervals: [],
        expectedVersion: 3,
      },
    );
  });
});
