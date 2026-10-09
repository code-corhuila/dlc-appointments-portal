
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

describe('AvailabilityPageComponent shift creation form', () => {
  let fixture: ComponentFixture<AvailabilityPageComponent>;
  let element: HTMLElement;
  let availability: DentistAvailability;
  let updateAvailability: ReturnType<typeof vi.fn>;

  const morningShift = {
    startAt: '2026-10-12T08:00:00-05:00',
    endAt: '2026-10-12T12:00:00-05:00',
  };

  const afternoonShift = {
    startAt: '2026-10-12T14:00:00-05:00',
    endAt: '2026-10-12T18:00:00-05:00',
  };

  beforeEach(async () => {
    availability = {
      id: 'availability-123',
      dentistId: 'dentist-123',
      intervals: [],
      blockedIntervals: [],
      version: 3,
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

  function setInput(
    selector: string,
    value: string,
  ): void {
    const input =
      element.querySelector<HTMLInputElement>(selector);

    expect(input).not.toBeNull();

    input!.value = value;
    input!.dispatchEvent(
      new Event('input', { bubbles: true }),
    );

    fixture.detectChanges();
  }

  function submitNewShift(
    startTime: string,
    endTime: string,
  ): void {
    setInput('[data-new-shift-date]', '2026-10-12');
    setInput('[data-new-shift-start]', startTime);
    setInput('[data-new-shift-end]', endTime);

    const button =
      element.querySelector<HTMLButtonElement>(
        '[data-add-shift]',
      );

    expect(button).not.toBeNull();

    button!.click();
    fixture.detectChanges();
  }

  function saveAvailability(): void {
    const button =
      element.querySelector<HTMLButtonElement>(
        '[data-availability-save]',
      );

    expect(button).not.toBeNull();

    button!.click();
    fixture.detectChanges();
  }

  it('creates and saves a shift when availability is empty', () => {
    selectDentist();

    submitNewShift('08:00', '12:00');
    saveAvailability();

    expect(updateAvailability).toHaveBeenCalledWith(
      'dentist-123',
      {
        intervals: [morningShift],
        blockedIntervals: [],
        expectedVersion: 3,
      },
    );
  });

  it('adds a second shift without removing the first', () => {
    availability = {
      ...availability,
      intervals: [morningShift],
    };

    selectDentist();

    submitNewShift('14:00', '18:00');
    saveAvailability();

    expect(updateAvailability).toHaveBeenCalledWith(
      'dentist-123',
      {
        intervals: [morningShift, afternoonShift],
        blockedIntervals: [],
        expectedVersion: 3,
      },
    );
  });

  it('rejects an overlapping shift without changing saved intervals', () => {
    availability = {
      ...availability,
      intervals: [morningShift],
    };

    selectDentist();

    submitNewShift('11:00', '14:00');

    const error = element.querySelector(
      '[data-shift-create-error]',
    );

    expect(error).not.toBeNull();

    saveAvailability();

    expect(updateAvailability).toHaveBeenCalledWith(
      'dentist-123',
      {
        intervals: [morningShift],
        blockedIntervals: [],
        expectedVersion: 3,
      },
    );
  });
});
