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

  private selectedDate:
    | string
    | null = null;

  protected readonly clinicTimeZone =
    CLINIC_TIME_ZONE;

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
    this.selectedDate =
      date || null;

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

    if (
      !this.selectedDentistId ||
      !this.selectedDate
    ) {
      return;
    }

    const dentistId =
      this.selectedDentistId;

    const clinicDate =
      this.selectedDate;

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