import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';

import { AppointmentsApiService } from '../data/appointments-api.service';
import {
  AvailabilitySlot,
  deriveAvailabilitySlotsForDate,
} from '../domain/availability-schedule';
import { CLINIC_TIME_ZONE } from '../domain/clinic-time';

interface SchedulingDateOption {
  readonly value: string;
  readonly weekday: string;
  readonly day: string;
  readonly month: string;
}

const DATE_OPTION_COUNT = 5;

@Component({
  selector: 'app-scheduling-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './scheduling-page.component.html',
  styleUrl: './scheduling-page.component.css',
})
export class SchedulingPageComponent {
  private readonly api =
    inject(AppointmentsApiService);

  private readonly destroyRef =
    inject(DestroyRef);

  private availabilityRequest?: Subscription;

  private selectedDentistId:
    | string
    | null = null;

  protected readonly clinicTimeZone =
    CLINIC_TIME_ZONE;

  protected readonly dateOptions =
    buildUpcomingDateOptions();

  readonly selectedDate =
    signal<string | null>(null);

  readonly availableSlots =
    signal<readonly AvailabilitySlot[]>([]);

  readonly selectedSlot =
    signal<AvailabilitySlot | null>(null);

  protected selectDentist(
    dentistId: string,
  ): void {
    this.selectedDentistId =
      dentistId || null;

    this.refreshAvailabilitySlots();
  }

  protected selectDate(
    date: string,
  ): void {
    this.selectedDate.set(
      date || null,
    );

    this.refreshAvailabilitySlots();
  }

  protected selectSlot(
    slot: AvailabilitySlot,
  ): void {
    this.selectedSlot.set(slot);
  }

  private refreshAvailabilitySlots(): void {
    this.availabilityRequest?.unsubscribe();

    this.availableSlots.set([]);
    this.selectedSlot.set(null);

    const clinicDate =
      this.selectedDate();

    if (
      !this.selectedDentistId ||
      !clinicDate
    ) {
      return;
    }

    const dentistId =
      this.selectedDentistId;

    this.availabilityRequest =
      this.api
        .getDentistAvailability(
          dentistId,
        )
        .pipe(
          takeUntilDestroyed(
            this.destroyRef,
          ),
        )
        .subscribe({
          next: (availability) => {
            this.availableSlots.set(
              deriveAvailabilitySlotsForDate(
                availability.intervals,
                clinicDate,
                availability.blockedIntervals,
              ),
            );
          },
          error: () => {
            this.availableSlots.set([]);
            this.selectedSlot.set(null);
          },
        });
  }
}

function buildUpcomingDateOptions():
  readonly SchedulingDateOption[] {
  const now = new Date();

  return Array.from(
    { length: DATE_OPTION_COUNT },
    (_, index) => {
      const candidate = new Date(now);

      candidate.setUTCDate(
        candidate.getUTCDate() + index,
      );

      return toSchedulingDateOption(
        candidate,
      );
    },
  );
}

function toSchedulingDateOption(
  date: Date,
): SchedulingDateOption {
  const parts =
    new Intl.DateTimeFormat(
      'es-CO',
      {
        timeZone: CLINIC_TIME_ZONE,
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      },
    )
      .formatToParts(date)
      .reduce<Record<string, string>>(
        (result, part) => {
          result[part.type] = part.value;
          return result;
        },
        {},
      );

  const numericParts =
    new Intl.DateTimeFormat(
      'en-US',
      {
        timeZone: CLINIC_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      },
    )
      .formatToParts(date)
      .reduce<Record<string, string>>(
        (result, part) => {
          result[part.type] = part.value;
          return result;
        },
        {},
      );

  return {
    value:
      `${numericParts['year']}-` +
      `${numericParts['month']}-` +
      `${numericParts['day']}`,
    weekday:
      capitalize(
        parts['weekday'].replace('.', ''),
      ),
    day: parts['day'],
    month:
      capitalize(
        parts['month'].replace('.', ''),
      ),
  };
}

function capitalize(
  value: string,
): string {
  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}