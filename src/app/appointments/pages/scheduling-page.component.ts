
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  finalize,
  Subscription,
} from 'rxjs';

import { AppointmentsApiService } from '../data/appointments-api.service';
import { CLINIC_TIME_ZONE_CONFIG } from '../data/clinic-time-zone-config';
import {
  DENTIST_DIRECTORY,
  DentistDirectoryItem,
} from '../data/dentist-directory';
import { PatientsLookupService } from '../data/patients-lookup.service';
import {
  AvailabilitySlot,
  DEFAULT_SLOT_DURATION_MINUTES,
  deriveAvailabilitySlotsForDate,
} from '../domain/availability-schedule';
import { IdempotencyKeyManager } from '../domain/idempotency-key';
import { CreateAppointmentRequest } from '../model/appointment';
import { PatientView } from '../model/patient';
import { toApiError } from '../model/to-api-error';

interface SchedulingDateOption {
  readonly value: string;
  readonly weekday: string;
  readonly day: string;
  readonly month: string;
}

const DATE_OPTION_COUNT = 5;

const APPOINTMENT_CONFLICT_MESSAGE =
  'Ese horario ya no está disponible. Seleccione otro horario.';

const APPOINTMENT_VALIDATION_MESSAGE =
  'Los datos de la cita no son válidos. Revise la información e intente nuevamente.';

const APPOINTMENT_FORBIDDEN_MESSAGE =
  'No tiene permisos para agendar esta cita.';

const APPOINTMENT_SERVICE_UNAVAILABLE_MESSAGE =
  'El servicio de citas no está disponible en este momento. Intente nuevamente.';

const APPOINTMENT_LOCAL_VALIDATION_MESSAGE =
  'Seleccione un paciente, un odontólogo y un horario antes de continuar.';

const APPOINTMENT_GENERIC_ERROR_MESSAGE =
  'No fue posible agendar la cita. Intente nuevamente.';

const APPOINTMENT_SUCCESS_MESSAGE =
  'Cita agendada correctamente.';

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

  private readonly dentistDirectory =
    inject(DENTIST_DIRECTORY);

  private readonly destroyRef =
    inject(DestroyRef);

  private readonly idempotencyKeys =
    new IdempotencyKeyManager();

  private availabilityRequest?: Subscription;
  private patientSearchRequest?: Subscription;

  protected readonly selectedDentistId =
    signal<string | null>(null);

  private lastPatientSearch:
    | string
    | null = null;

  private appointmentReason = '';

  protected readonly clinicTimeZone =
    inject(CLINIC_TIME_ZONE_CONFIG);

  protected readonly dateOptions =
    buildUpcomingDateOptions(this.clinicTimeZone);

  protected readonly dentists =
    signal<readonly DentistDirectoryItem[]>([]);

  protected readonly selectedDentistName =
    computed(() => {
      const dentistId = this.selectedDentistId();

      return (
        this.dentists().find(
          (dentist) => dentist.id === dentistId,
        )?.name ?? null
      );
    });

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

  readonly isAppointmentCreating =
    signal(false);

  readonly appointmentError =
    signal<string | null>(null);

  readonly appointmentSuccess =
    signal<string | null>(null);

  constructor() {
    this.dentistDirectory
      .listDentists()
      .pipe(
        takeUntilDestroyed(
          this.destroyRef,
        ),
      )
      .subscribe({
        next: (dentists) => {
          this.dentists.set(dentists);
        },
        error: () => {
          this.dentists.set([]);
        },
      });
  }

  protected searchPatients(
    search: string,
  ): void {
    this.patientSearchRequest?.unsubscribe();

    // A new search invalidates the previous selection.
    this.selectedPatient.set(null);
    this.clearAppointmentFeedback();

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

    this.clearAppointmentFeedback();
  }

  protected selectDentist(
    dentistId: string,
  ): void {
    this.selectedDentistId.set(
      dentistId || null,
    );

    this.clearAppointmentFeedback();

    this.refreshAvailabilitySlots();
  }

  protected selectDate(
    date: string,
  ): void {
    this.selectedDate.set(
      date || null,
    );

    this.clearAppointmentFeedback();

    this.refreshAvailabilitySlots();
  }

  protected selectSlot(
    slot: AvailabilitySlot,
  ): void {
    this.selectedSlot.set(slot);

    this.clearAppointmentFeedback();
  }

  protected setAppointmentReason(
    reason: string,
  ): void {
    this.appointmentReason = reason;
  }

  protected createAppointment(): void {
    if (this.isAppointmentCreating()) {
      return;
    }

    const patient =
      this.selectedPatient();

    const dentistId =
      this.selectedDentistId();

    const slot =
      this.selectedSlot();

    if (
      !patient ||
      !dentistId ||
      !slot
    ) {
      this.appointmentSuccess.set(null);

      this.appointmentError.set(
        APPOINTMENT_LOCAL_VALIDATION_MESSAGE,
      );

      return;
    }

    const request: CreateAppointmentRequest = {
      patientId: patient.id,
      dentistId,
      startAt: slot.startAt,
      endAt: slot.endAt,
      reason: this.appointmentReason.trim(),
    };

    const idempotencyKey =
      this.idempotencyKeys.forIntent(
        request,
      );

    this.clearAppointmentFeedback();
    this.isAppointmentCreating.set(true);

    this.api
      .createAppointment(
        request,
        idempotencyKey,
      )
      .pipe(
        takeUntilDestroyed(
          this.destroyRef,
        ),
        finalize(() => {
          this.isAppointmentCreating.set(
            false,
          );
        }),
      )
      .subscribe({
        next: () => {
          this.appointmentError.set(null);

          this.appointmentSuccess.set(
            APPOINTMENT_SUCCESS_MESSAGE,
          );
        },
        error: (error: unknown) => {
          this.appointmentSuccess.set(null);

          const errorCode =
            toApiError(error).error;

          switch (errorCode) {
            case 'APPOINTMENT_CONFLICT':
              this.appointmentError.set(
                APPOINTMENT_CONFLICT_MESSAGE,
              );
              break;

            case 'VALIDATION_ERROR':
              this.appointmentError.set(
                APPOINTMENT_VALIDATION_MESSAGE,
              );
              break;

            case 'FORBIDDEN':
              this.appointmentError.set(
                APPOINTMENT_FORBIDDEN_MESSAGE,
              );
              break;

            case 'SERVICE_UNAVAILABLE':
              this.appointmentError.set(
                APPOINTMENT_SERVICE_UNAVAILABLE_MESSAGE,
              );
              break;

            default:
              this.appointmentError.set(
                APPOINTMENT_GENERIC_ERROR_MESSAGE,
              );
              break;
          }
        },
      });
  }

  protected retryAvailability(): void {
    this.refreshAvailabilitySlots();
  }

  private clearAppointmentFeedback(): void {
    this.appointmentError.set(null);
    this.appointmentSuccess.set(null);
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

    const dentistId =
      this.selectedDentistId();

    if (
      !dentistId ||
      !clinicDate
    ) {
      return;
    }

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
                  DEFAULT_SLOT_DURATION_MINUTES,
                  this.clinicTimeZone,
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

function buildUpcomingDateOptions(
  timeZone: string,
): readonly SchedulingDateOption[] {
  // Read today's calendar date in the configured clinic time zone.
  const todayParts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(new Date())
      .map((part) => [
        part.type,
        part.value,
      ]),
  );

  // Use UTC calendar arithmetic so host time zones and DST
  // changes cannot shift the selected clinic calendar date.
  const firstDate = new Date(
    Date.UTC(
      Number(todayParts['year']),
      Number(todayParts['month']) - 1,
      Number(todayParts['day']),
    ),
  );

  return Array.from(
    { length: DATE_OPTION_COUNT },
    (_, index) => {
      const candidate = new Date(firstDate);

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
  // The date already represents a clinic calendar day.
  // Format in UTC to preserve that exact calendar date.
  const parts =
    new Intl.DateTimeFormat(
      'es-CO',
      {
        timeZone: 'UTC',
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
        timeZone: 'UTC',
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
