import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  finalize,
  Subscription,
} from 'rxjs';

import { AppointmentsApiService } from '../data/appointments-api.service';
import { PatientsLookupService } from '../data/patients-lookup.service';
import {
  AvailabilitySlot,
  deriveAvailabilitySlotsForDate,
} from '../domain/availability-schedule';
import { CLINIC_TIME_ZONE } from '../domain/clinic-time';
import { IdempotencyKeyManager } from '../domain/idempotency-key';
import { CreateAppointmentRequest } from '../model/appointment';
import { PatientView } from '../model/patient';

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

  private readonly patients =
    inject(PatientsLookupService);

  private readonly destroyRef =
    inject(DestroyRef);

  private readonly idempotencyKeys =
    new IdempotencyKeyManager();

  private availabilityRequest?: Subscription;
  private patientSearchRequest?: Subscription;

  private selectedDentistId:
    | string
    | null = null;

  private lastPatientSearch:
    | string
    | null = null;

  private appointmentReason = '';

  protected readonly clinicTimeZone =
    CLINIC_TIME_ZONE;

  protected readonly dateOptions =
    buildUpcomingDateOptions();

  readonly patientResults =
    signal<readonly PatientView[]>([]);

  readonly selectedPatient =
    signal<PatientView | null>(null);

  readonly isPatientSearchLoading =
    signal(false);

  readonly hasCompletedPatientSearch =
    signal(false);

  readonly hasPatientSearchError =
    signal(false);

  readonly selectedDate =
    signal<string | null>(null);

  readonly availableSlots =
    signal<readonly AvailabilitySlot[]>([]);

  readonly selectedSlot =
    signal<AvailabilitySlot | null>(null);

  readonly isAvailabilityLoading =
    signal(false);

  readonly hasLoadedAvailability =
    signal(false);

  readonly hasAvailabilityError =
    signal(false);

  protected searchPatients(
    search: string,
  ): void {
    this.patientSearchRequest?.unsubscribe();

    this.isPatientSearchLoading.set(false);
    this.hasCompletedPatientSearch.set(false);
    this.hasPatientSearchError.set(false);
    this.patientResults.set([]);

    const normalizedSearch =
      search.trim();

    if (!normalizedSearch) {
      this.lastPatientSearch = null;
      return;
    }

    this.lastPatientSearch =
      normalizedSearch;

    this.isPatientSearchLoading.set(true);

    this.patientSearchRequest =
      this.patients
        .searchPatients({
          search: normalizedSearch,
          status: 'ACTIVE',
        })
        .pipe(
          takeUntilDestroyed(
            this.destroyRef,
          ),
          finalize(() => {
            this.isPatientSearchLoading.set(
              false,
            );
          }),
        )
        .subscribe({
          next: (page) => {
            this.patientResults.set(
              page.data,
            );

            this.hasCompletedPatientSearch.set(
              true,
            );

            this.hasPatientSearchError.set(
              false,
            );
          },
          error: () => {
            this.patientResults.set([]);

            this.hasCompletedPatientSearch.set(
              false,
            );

            this.hasPatientSearchError.set(
              true,
            );
          },
        });
  }

  protected retryPatientSearch(): void {
    if (!this.lastPatientSearch) {
      return;
    }

    this.searchPatients(
      this.lastPatientSearch,
    );
  }

  protected selectPatient(
    patient: PatientView,
  ): void {
    this.selectedPatient.set(patient);
    this.patientResults.set([]);
    this.hasCompletedPatientSearch.set(false);
    this.hasPatientSearchError.set(false);
  }

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

  protected setAppointmentReason(
    reason: string,
  ): void {
    this.appointmentReason = reason;
  }

  protected createAppointment(): void {
    const patient =
      this.selectedPatient();

    const slot =
      this.selectedSlot();

    if (
      !patient ||
      !this.selectedDentistId ||
      !slot
    ) {
      return;
    }

    const request: CreateAppointmentRequest = {
      patientId: patient.id,
      dentistId: this.selectedDentistId,
      startAt: slot.startAt,
      endAt: slot.endAt,
      reason: this.appointmentReason.trim(),
    };

    const idempotencyKey =
      this.idempotencyKeys.forIntent(
        request,
      );

    this.api
      .createAppointment(
        request,
        idempotencyKey,
      )
      .pipe(
        takeUntilDestroyed(
          this.destroyRef,
        ),
      )
      .subscribe({
        next: () => undefined,
        error: () => undefined,
      });
  }

  protected retryAvailability(): void {
    this.refreshAvailabilitySlots();
  }

  private refreshAvailabilitySlots(): void {
    this.availabilityRequest?.unsubscribe();

    this.isAvailabilityLoading.set(false);
    this.hasLoadedAvailability.set(false);
    this.hasAvailabilityError.set(false);
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

    this.isAvailabilityLoading.set(true);

    this.availabilityRequest =
      this.api
        .getDentistAvailability(
          dentistId,
        )
        .pipe(
          takeUntilDestroyed(
            this.destroyRef,
          ),
          finalize(() => {
            this.isAvailabilityLoading.set(
              false,
            );
          }),
        )
        .subscribe({
          next: (availability) => {
            try {
              const slots =
                deriveAvailabilitySlotsForDate(
                  availability.intervals,
                  clinicDate,
                  availability.blockedIntervals,
                );

              this.availableSlots.set(slots);

              this.hasLoadedAvailability.set(
                true,
              );

              this.hasAvailabilityError.set(
                false,
              );
            } catch {
              this.availableSlots.set([]);
              this.selectedSlot.set(null);

              this.hasLoadedAvailability.set(
                false,
              );

              this.hasAvailabilityError.set(
                true,
              );
            }
          },
          error: () => {
            this.availableSlots.set([]);
            this.selectedSlot.set(null);

            this.hasLoadedAvailability.set(
              false,
            );

            this.hasAvailabilityError.set(
              true,
            );
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