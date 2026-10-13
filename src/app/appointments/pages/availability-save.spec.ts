
import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import { AppointmentsApiService } from '../data/appointments-api.service';
import {
  DentistAvailability,
  UpdateDentistAvailabilityRequest,
} from '../model/availability';
import { AvailabilityPageComponent } from './availability-page.component';

describe('AvailabilityPageComponent save availability', () => {
  let fixture: ComponentFixture<AvailabilityPageComponent>;
  let element: HTMLElement;
  let updateAvailability: ReturnType<typeof vi.fn>;

  const initialAvailability: DentistAvailability = {
    id: 'availability-123',
    dentistId: 'dentist-123',
    intervals: [
      {
        startAt: '2026-10-05T14:00:00Z',
        endAt: '2026-10-05T15:00:00Z',
      },
    ],
    blockedIntervals: [
      {
        startAt: '2026-10-05T16:00:00Z',
        endAt: '2026-10-05T16:30:00Z',
      },
    ],
    version: 7,
  };

  beforeEach(async () => {
    updateAvailability = vi.fn(
      (
        _dentistId: string,
        request: UpdateDentistAvailabilityRequest,
      ) =>
        of({
          ...initialAvailability,
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
            getDentistAvailability: () =>
              of(initialAvailability),
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

    const select = element.querySelector<HTMLSelectElement>(
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
  });

  function clickSave(): void {
    const button = element.querySelector<HTMLButtonElement>(
      '[data-availability-save]',
    );

    expect(button).not.toBeNull();
    button!.click();
    fixture.detectChanges();
  }

  function changeStartTime(time: string): void {
    const input = element.querySelector<HTMLInputElement>(
      '[data-day="monday"] [data-shift-one-start]',
    );

    expect(input).not.toBeNull();

    input!.value = time;
    input!.dispatchEvent(
      new Event('change', { bubbles: true }),
    );

    fixture.detectChanges();
  }

  it('saves edited intervals, blocked intervals and expectedVersion', () => {
    changeStartTime('09:30');
    clickSave();

    expect(updateAvailability).toHaveBeenCalledWith(
      'dentist-123',
      {
        intervals: [
          {
            startAt: '2026-10-05T09:30:00-05:00',
            endAt: '2026-10-05T15:00:00Z',
          },
        ],
        blockedIntervals: initialAvailability.blockedIntervals,
        expectedVersion: 7,
      },
    );

    expect(
      element.querySelector(
        '[data-availability-save-success]',
      )?.textContent,
    ).toMatch(/guardad/i);
  });

  it('uses the updated server version for the next save', () => {
    changeStartTime('09:30');
    clickSave();

    changeStartTime('09:45');
    clickSave();

    expect(updateAvailability).toHaveBeenCalledTimes(2);

    expect(updateAvailability).toHaveBeenNthCalledWith(
      2,
      'dentist-123',
      expect.objectContaining({
        expectedVersion: 8,
      }),
    );
  });

  it('shows a forbidden message when the server returns 403', () => {
    updateAvailability.mockImplementation(() =>
      throwError(
        () =>
          new HttpErrorResponse({
            status: 403,
            error: {
              error: 'FORBIDDEN',
              message: 'Forbidden',
            },
          }),
      ),
    );

    changeStartTime('09:30');
    clickSave();

    expect(
      element.querySelector(
        '[data-availability-save-error]',
      )?.textContent,
    ).toMatch(/permiso|autorizad/i);
  });

  it('shows a conflict message when the server returns 409', () => {
    updateAvailability.mockImplementation(() =>
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: {
              error: 'AVAILABILITY_VERSION_CONFLICT',
              message: 'Version conflict',
            },
          }),
      ),
    );

    changeStartTime('09:30');
    clickSave();

    expect(
      element.querySelector(
        '[data-availability-save-error]',
      )?.textContent,
    ).toMatch(/conflicto|versi[oó]n|actualizad/i);
  });
});
