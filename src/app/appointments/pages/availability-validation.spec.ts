
import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppointmentsApiService } from '../data/appointments-api.service';
import {
  AvailabilityInterval,
  DentistAvailability,
  UpdateDentistAvailabilityRequest,
} from '../model/availability';
import { AvailabilityPageComponent } from './availability-page.component';

describe('AvailabilityPageComponent interval validation', () => {
  let fixture: ComponentFixture<AvailabilityPageComponent>;
  let element: HTMLElement;
  let availability: DentistAvailability;
  let updateAvailability: ReturnType<typeof vi.fn>;

  const mondayMorning: AvailabilityInterval = {
    startAt: '2026-10-05T14:00:00Z',
    endAt: '2026-10-05T15:00:00Z',
  };

  const mondayAfternoon: AvailabilityInterval = {
    startAt: '2026-10-05T16:00:00Z',
    endAt: '2026-10-05T17:00:00Z',
  };

  const followingMonday: AvailabilityInterval = {
    startAt: '2026-10-12T14:00:00Z',
    endAt: '2026-10-12T15:00:00Z',
  };

  beforeEach(async () => {
    availability = {
      id: 'availability-123',
      dentistId: 'dentist-123',
      intervals: [mondayMorning],
      blockedIntervals: [],
      version: 5,
    };

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
  });

  function selectDentist(): void {
    const select =
      element.querySelector<HTMLSelectElement>(
        '[data-dentist-select]',
      );

    expect(select).not.toBeNull();

    const option = document.createElement('option');
    option.value = 'dentist-123';
    option.textContent = 'Test Dentist';

    select!.append(option);
    select!.value = 'dentist-123';
    select!.dispatchEvent(
      new Event('change', { bubbles: true }),
    );

    fixture.detectChanges();
  }

  function editTime(
    selector: string,
    value: string,
  ): void {
    const input =
      element.querySelector<HTMLInputElement>(selector);

    expect(input).not.toBeNull();

    input!.value = value;
    input!.dispatchEvent(
      new Event('change', { bubbles: true }),
    );

    fixture.detectChanges();
  }

  function save(): void {
    const button =
      element.querySelector<HTMLButtonElement>(
        '[data-availability-save]',
      );

    expect(button).not.toBeNull();
    button!.click();
    fixture.detectChanges();
  }

  it('rejects an edited interval whose end is before its start', () => {
    selectDentist();

    editTime(
      '[data-day="monday"] [data-shift-one-end]',
      '08:30',
    );

    save();

    expect(updateAvailability).not.toHaveBeenCalled();

    expect(
      element.querySelector(
        '[data-availability-save-error]',
      )?.textContent,
    ).toMatch(/horario|intervalo|válido|hora/i);
  });

  it('rejects overlapping intervals after editing a shift', () => {
    availability = {
      ...availability,
      intervals: [
        mondayMorning,
        mondayAfternoon,
      ],
    };

    selectDentist();

    editTime(
      '[data-day="monday"] [data-shift-one-end]',
      '11:30',
    );

    save();

    expect(updateAvailability).not.toHaveBeenCalled();

    expect(
      element.querySelector(
        '[data-availability-save-error]',
      )?.textContent,
    ).toMatch(/superposici[oó]n|conflicto|cruce/i);
  });

  it('protects intervals belonging to different calendar Mondays', () => {
    availability = {
      ...availability,
      intervals: [
        mondayMorning,
        followingMonday,
      ],
    };

    selectDentist();

    const secondShift =
      element.querySelector<HTMLInputElement>(
        '#monday-second-shift',
      );

    expect(secondShift).not.toBeNull();

    // Two separate Mondays are not two shifts on one date.
    expect(secondShift!.disabled).toBe(true);

    secondShift!.click();
    fixture.detectChanges();

    save();

    expect(updateAvailability).toHaveBeenCalledWith(
      'dentist-123',
      {
        intervals: [
          mondayMorning,
          followingMonday,
        ],
        blockedIntervals: [],
        expectedVersion: 5,
      },
    );
  });
});
