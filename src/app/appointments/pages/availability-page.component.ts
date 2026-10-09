
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Subscription } from 'rxjs';

import { AppointmentsApiService } from '../data/appointments-api.service';
import { CLINIC_TIME_ZONE_CONFIG } from '../data/clinic-time-zone-config';
import {
  addAvailabilityShift,
  AvailabilityDayDefaults,
  AvailabilityDayKey,
  AvailabilityTimeField,
  DEFAULT_SLOT_DURATION_MINUTES,
  DEFAULT_WEEKLY_AVAILABILITY,
  mapAvailabilityIntervalsToWeek,
  updateAvailabilityIntervalTime,
  WeeklyAvailabilitySchedule,
} from '../domain/availability-schedule';
import { ApiError } from '../model/api-error';
import {
  AvailabilityInterval,
  DentistAvailability,
  UpdateDentistAvailabilityRequest,
} from '../model/availability';
import { toApiError } from '../model/to-api-error';

const AVAILABILITY_SAVE_FORBIDDEN_MESSAGE =
  'No tiene permisos para modificar la disponibilidad de este odontólogo.';

const AVAILABILITY_SAVE_CONFLICT_MESSAGE =
  'La disponibilidad cambió o existe un conflicto de horarios. Actualice la información antes de guardar nuevamente.';

const AVAILABILITY_SAVE_GENERIC_MESSAGE =
  'No fue posible guardar la disponibilidad. Intente nuevamente.';

const AVAILABILITY_SAVE_SUCCESS_MESSAGE =
  'Disponibilidad guardada correctamente.';

@Component({
  selector: 'app-availability-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './availability-page.component.css',
  template: `
    <main class="availability-page">
      <header class="page-header">
        <h1>Horarios y Slots de Disponibilidad</h1>
        <p>
          Configuración semanal de la agenda de los dentistas del Consultorio
          DI-LUCCA y generación automática de slots.
        </p>
      </header>

      <section class="dentist-card">
        <div class="dentist-label">
          <label for="dentist">
            Seleccionar Odontólogo / Especialista:
          </label>
        </div>

        <select
          id="dentist"
          data-dentist-select
          [disabled]="availabilitySaving()"
          (change)="loadAvailability($any($event.target).value)"
        >
          <option value="">Seleccione un odontólogo</option>
        </select>
      </section>

      @if (availabilityLoading()) {
        <div
          data-availability-loading
          aria-busy="true"
          aria-live="polite"
        >
          <p>Cargando disponibilidad...</p>
        </div>
      }

      @if (availabilityEmpty()) {
        <div
          data-availability-empty
          aria-live="polite"
        >
          <p>
            No hay disponibilidad configurada para este odontólogo.
          </p>
        </div>
      }

      @if (availabilityError(); as error) {
        <div
          data-availability-error
          role="alert"
        >
          <p>{{ error.message }}</p>

          <button
            type="button"
            data-availability-retry
            (click)="retryAvailability()"
          >
            Reintentar
          </button>
        </div>
      }

      <div class="availability-layout">
        <section class="schedule-panel" data-weekly-schedule>
          <header class="panel-header">
            <h2>Configurar Horario Semanal</h2>
            <p>
              Define las horas de atención y la duración de cada cita por día
              de la semana.
            </p>
          </header>

          @for (day of weekDays; track day.key) {
            <article class="day-card" [attr.data-day]="day.key">
              <div class="day-heading">
                <input
                  type="checkbox"
                  [id]="day.key + '-enabled'"
                  [checked]="isDayEnabled(day.key)"
                  [disabled]="availabilitySaving()"
                  (change)="
                    setDayEnabled(
                      day.key,
                      $any($event.target).checked
                    )
                  "
                />

                <label [for]="day.key + '-enabled'">
                  {{ day.label }}
                </label>
              </div>

              <div class="shift-row">
                <strong class="shift-badge">Turno 1:</strong>

                <label [for]="day.key + '-shift-one-start'">
                  Desde:
                </label>

                <input
                  [id]="day.key + '-shift-one-start'"
                  type="time"
                  [value]="shiftStart(day, 0)"
                  data-shift-one-start
                  [disabled]="!isDayEnabled(day.key) || availabilitySaving()"
                  (change)="
                    updateShiftTime(
                      day.key,
                      0,
                      'startAt',
                      $any($event.target).value
                    )
                  "
                />

                <label [for]="day.key + '-shift-one-end'">
                  Hasta:
                </label>

                <input
                  [id]="day.key + '-shift-one-end'"
                  type="time"
                  [value]="shiftEnd(day, 0)"
                  data-shift-one-end
                  [disabled]="!isDayEnabled(day.key) || availabilitySaving()"
                  (change)="
                    updateShiftTime(
                      day.key,
                      0,
                      'endAt',
                      $any($event.target).value
                    )
                  "
                />
              </div>

              <div class="second-shift-toggle">
                <input
                  type="checkbox"
                  [id]="day.key + '-second-shift'"
                  [checked]="isSecondShiftEnabled(day)"
                  [disabled]="
                    !isDayEnabled(day.key) ||
                    availabilitySaving() ||
                    (hasLoadedAvailability() && !hasSecondShift(day))
                  "
                  (change)="
                    setSecondShiftEnabled(
                      day,
                      $any($event.target).checked
                    )
                  "
                />

                <label [for]="day.key + '-second-shift'">
                  + Segundo Turno (Tarde)
                </label>
              </div>

              <div class="shift-row">
                <strong class="shift-badge">Turno 2:</strong>

                <label [for]="day.key + '-shift-two-start'">
                  Desde:
                </label>

                <input
                  [id]="day.key + '-shift-two-start'"
                  type="time"
                  [value]="shiftStart(day, 1)"
                  data-shift-two-start
                  [disabled]="
                    !isDayEnabled(day.key) ||
                    !isSecondShiftEnabled(day) ||
                    availabilitySaving()
                  "
                  (change)="
                    updateShiftTime(
                      day.key,
                      1,
                      'startAt',
                      $any($event.target).value
                    )
                  "
                />

                <label [for]="day.key + '-shift-two-end'">
                  Hasta:
                </label>

                <input
                  [id]="day.key + '-shift-two-end'"
                  type="time"
                  [value]="shiftEnd(day, 1)"
                  data-shift-two-end
                  [disabled]="
                    !isDayEnabled(day.key) ||
                    !isSecondShiftEnabled(day) ||
                    availabilitySaving()
                  "
                  (change)="
                    updateShiftTime(
                      day.key,
                      1,
                      'endAt',
                      $any($event.target).value
                    )
                  "
                />
              </div>

              <div class="slot-duration">
                <label [for]="day.key + '-slot-duration'">
                  Duración Slot:
                </label>

                <select
                  [id]="day.key + '-slot-duration'"
                  data-slot-duration
                  [disabled]="!isDayEnabled(day.key) || availabilitySaving()"
                >
                  <option [value]="slotDurationMinutes">
                    {{ slotDurationMinutes }} Min
                  </option>
                </select>
              </div>
            </article>
          }
        </section>

        <aside class="generator-panel">
          <header class="panel-header">
            <h2>Generador de Slots</h2>
            <p>
              Genera los horarios disponibles en la base de datos para la
              reserva de citas.
            </p>
          </header>

          <label for="start-date">Fecha de Inicio *</label>
          <input id="start-date" type="date" data-start-date />

          <label for="end-date">Fecha de Fin *</label>
          <input id="end-date" type="date" data-end-date />

          <button type="button" data-generate-slots>
            Generar Slots de Disponibilidad
          </button>

          <section data-shift-creation-form>
            <h3>Agregar turno de disponibilidad</h3>

            <p>
              Seleccione una fecha concreta y las horas del nuevo turno.
            </p>

            <label for="new-shift-date">
              Fecha del turno *
            </label>

            <input
              id="new-shift-date"
              type="date"
              data-new-shift-date
              [value]="newShiftDate()"
              [disabled]="!hasLoadedAvailability() || availabilitySaving()"
              (input)="
                newShiftDate.set($any($event.target).value)
              "
            />

            <label for="new-shift-start">
              Hora de inicio *
            </label>

            <input
              id="new-shift-start"
              type="time"
              data-new-shift-start
              [value]="newShiftStart()"
              [disabled]="!hasLoadedAvailability() || availabilitySaving()"
              (input)="
                newShiftStart.set($any($event.target).value)
              "
            />

            <label for="new-shift-end">
              Hora de finalización *
            </label>

            <input
              id="new-shift-end"
              type="time"
              data-new-shift-end
              [value]="newShiftEnd()"
              [disabled]="!hasLoadedAvailability() || availabilitySaving()"
              (input)="
                newShiftEnd.set($any($event.target).value)
              "
            />

            <button
              type="button"
              data-add-shift
              [disabled]="!hasLoadedAvailability() || availabilitySaving()"
              (click)="addNewShift()"
            >
              Agregar turno
            </button>

            @if (newShiftError(); as message) {
              <p data-shift-create-error role="alert">
                {{ message }}
              </p>
            }

            @if (newShiftSuccess()) {
              <p
                data-shift-create-success
                role="status"
                aria-live="polite"
              >
                Turno agregado. Guarde los cambios para enviarlo al servidor.
              </p>
            }
          </section>

          <p>
            Zona horaria: <strong>{{ clinicTimeZone }}</strong>
          </p>

          <button
            type="button"
            data-availability-save
            [disabled]="!hasLoadedAvailability() || availabilitySaving()"
            (click)="saveAvailability()"
          >
            @if (availabilitySaving()) {
              Guardando...
            } @else {
              Guardar cambios
            }
          </button>

          @if (availabilitySaveSuccess()) {
            <p
              data-availability-save-success
              role="status"
              aria-live="polite"
            >
              {{ availabilitySaveSuccessMessage }}
            </p>
          }

          @if (availabilitySaveError(); as message) {
            <p
              data-availability-save-error
              role="alert"
            >
              {{ message }}
            </p>
          }
        </aside>
      </div>

      <section class="generated-slots">
        <h2>Slots generados</h2>
        <p data-slots-empty>No hay slots generados.</p>
      </section>
    </main>
  `,
})
export class AvailabilityPageComponent {
  private readonly api = inject(AppointmentsApiService);
  private readonly destroyRef = inject(DestroyRef);

  private availabilityRequest?: Subscription;
  private loadedAvailability: DentistAvailability | null = null;

  protected readonly weekDays = DEFAULT_WEEKLY_AVAILABILITY;
  protected readonly slotDurationMinutes =
    DEFAULT_SLOT_DURATION_MINUTES;
  protected readonly clinicTimeZone = inject(CLINIC_TIME_ZONE_CONFIG);

  protected readonly availabilitySaveSuccessMessage =
    AVAILABILITY_SAVE_SUCCESS_MESSAGE;

  protected readonly availabilityLoading = signal(false);
  protected readonly availabilityEmpty = signal(false);
  protected readonly availabilityError =
    signal<ApiError | null>(null);

  protected readonly availabilitySaving = signal(false);
  protected readonly availabilitySaveSuccess = signal(false);
  protected readonly availabilitySaveError =
    signal<string | null>(null);

  protected readonly newShiftDate = signal('');
  protected readonly newShiftStart = signal('');
  protected readonly newShiftEnd = signal('');
  protected readonly newShiftError =
    signal<string | null>(null);
  protected readonly newShiftSuccess = signal(false);

  private readonly loadedSchedule =
    signal<WeeklyAvailabilitySchedule>({});

  protected readonly hasLoadedAvailability = signal(false);

  private selectedDentistId: string | null = null;

  private readonly enabledDays = signal<Record<string, boolean>>(
    Object.fromEntries(
      DEFAULT_WEEKLY_AVAILABILITY.map((day) => [
        day.key,
        day.enabled,
      ]),
    ),
  );

  private readonly disabledSecondShifts =
    signal<Record<string, boolean>>({});

  protected loadAvailability(dentistId: string): void {
    if (this.availabilitySaving()) {
      return;
    }

    this.availabilityRequest?.unsubscribe();

    this.clearSaveFeedback();
    this.resetNewShiftForm();
    this.disabledSecondShifts.set({});

    if (!dentistId) {
      this.selectedDentistId = null;
      this.loadedAvailability = null;
      this.availabilityLoading.set(false);
      this.availabilityError.set(null);
      this.availabilityEmpty.set(false);
      this.hasLoadedAvailability.set(false);
      this.loadedSchedule.set({});
      this.resetEnabledDays();
      return;
    }

    this.selectedDentistId = dentistId;
    this.loadedAvailability = null;
    this.availabilityError.set(null);
    this.availabilityEmpty.set(false);
    this.availabilityLoading.set(true);
    this.hasLoadedAvailability.set(false);
    this.loadedSchedule.set({});

    this.availabilityRequest = this.api
      .getDentistAvailability(dentistId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.availabilityLoading.set(false);
        }),
      )
      .subscribe({
        next: (availability) => {
          this.loadedAvailability = availability;
          this.applyAvailability(availability);

          this.availabilityEmpty.set(
            availability.intervals.length === 0,
          );
        },
        error: (error: unknown) => {
          this.loadedAvailability = null;
          this.availabilityEmpty.set(false);
          this.availabilityError.set(toApiError(error));
        },
      });
  }

  protected retryAvailability(): void {
    if (!this.selectedDentistId) {
      return;
    }

    this.loadAvailability(
      this.selectedDentistId,
    );
  }

  protected addNewShift(): void {
    if (
      !this.loadedAvailability ||
      !this.selectedDentistId ||
      this.availabilitySaving()
    ) {
      return;
    }

    this.newShiftError.set(null);
    this.newShiftSuccess.set(false);

    const date = this.newShiftDate();
    const start = this.newShiftStart();
    const end = this.newShiftEnd();

    if (!date || !start || !end) {
      this.newShiftError.set(
        'Complete la fecha y las horas de inicio y finalización.',
      );
      return;
    }

    try {
      const intervals = addAvailabilityShift(
        this.loadedAvailability.intervals,
        date,
        start,
        end,
        this.clinicTimeZone,
      );

      const newInterval = intervals[intervals.length - 1];

      const newSchedule = mapAvailabilityIntervalsToWeek(
        newInterval ? [newInterval] : [],
        this.clinicTimeZone,
      );

      const dayKey = Object.keys(newSchedule)[0];

      if (!dayKey) {
        this.newShiftError.set(
          'La fecha seleccionada no corresponde a un día configurable.',
        );
        return;
      }

      this.loadedAvailability = {
        ...this.loadedAvailability,
        intervals,
      };

      this.loadedSchedule.set(
        mapAvailabilityIntervalsToWeek(
          intervals,
          this.clinicTimeZone,
        ),
      );

      // Enable the new interval's day so saving does not discard it.
      this.enabledDays.update((current) => ({
        ...current,
        [dayKey]: true,
      }));

      // Include a newly added second shift in the next save request.
      this.disabledSecondShifts.update((current) => ({
        ...current,
        [dayKey]: false,
      }));

      this.availabilityEmpty.set(false);
      this.clearSaveFeedback();

      this.newShiftStart.set('');
      this.newShiftEnd.set('');
      this.newShiftSuccess.set(true);
    } catch (error: unknown) {
      const message =
        error instanceof Error &&
        error.message.includes('overlap')
          ? 'El turno se superpone con otro horario de disponibilidad.'
          : 'La fecha o el rango de horas no es válido. Revise los datos.';

      this.newShiftError.set(message);
    }
  }

  protected updateShiftTime(
    dayKey: string,
    shiftIndex: number,
    field: AvailabilityTimeField,
    time: string,
  ): void {
    if (
      !this.loadedAvailability ||
      this.availabilitySaving() ||
      !this.isDayEnabled(dayKey)
    ) {
      return;
    }

    const intervals =
      updateAvailabilityIntervalTime(
        this.loadedAvailability.intervals,
        dayKey as AvailabilityDayKey,
        shiftIndex,
        field,
        time,
        this.clinicTimeZone,
      );

    this.loadedAvailability = {
      ...this.loadedAvailability,
      intervals,
    };

    this.clearSaveFeedback();

    this.loadedSchedule.set(
      mapAvailabilityIntervalsToWeek(
        intervals,
        this.clinicTimeZone,
      ),
    );
  }

  protected saveAvailability(): void {
    if (
      !this.loadedAvailability ||
      !this.selectedDentistId ||
      this.availabilitySaving()
    ) {
      return;
    }

    const dentistId = this.selectedDentistId;

    const request: UpdateDentistAvailabilityRequest = {
      intervals: this.getEnabledIntervals(),
      blockedIntervals: this.loadedAvailability.blockedIntervals,
      expectedVersion: this.loadedAvailability.version,
    };

    this.clearSaveFeedback();
    this.availabilitySaving.set(true);

    this.api
      .updateDentistAvailability(dentistId, request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.availabilitySaving.set(false);
        }),
      )
      .subscribe({
        next: (availability) => {
          if (this.selectedDentistId !== dentistId) {
            return;
          }

          this.loadedAvailability = availability;
          this.applyAvailability(availability);

          this.availabilityEmpty.set(
            availability.intervals.length === 0,
          );

          this.newShiftSuccess.set(false);
          this.availabilitySaveError.set(null);
          this.availabilitySaveSuccess.set(true);
        },
        error: (error: unknown) => {
          if (this.selectedDentistId !== dentistId) {
            return;
          }

          const apiError = toApiError(error);

          const status =
            error instanceof HttpErrorResponse
              ? error.status
              : 0;

          if (
            status === 403 ||
            apiError.error === 'FORBIDDEN'
          ) {
            this.availabilitySaveError.set(
              AVAILABILITY_SAVE_FORBIDDEN_MESSAGE,
            );
          } else if (
            status === 409 ||
            apiError.error === 'STALE_VERSION' ||
            apiError.error === 'APPOINTMENT_CONFLICT'
          ) {
            this.availabilitySaveError.set(
              AVAILABILITY_SAVE_CONFLICT_MESSAGE,
            );
          } else {
            this.availabilitySaveError.set(
              AVAILABILITY_SAVE_GENERIC_MESSAGE,
            );
          }

          this.availabilitySaveSuccess.set(false);
        },
      });
  }

  protected shiftStart(
    day: AvailabilityDayDefaults,
    index: number,
  ): string {
    const shift =
      this.loadedSchedule()[
        day.key as AvailabilityDayKey
      ]?.[index];

    if (this.hasLoadedAvailability()) {
      return shift?.start ?? '';
    }

    return index === 0
      ? day.shiftOne.start
      : day.shiftTwo.start;
  }

  protected shiftEnd(
    day: AvailabilityDayDefaults,
    index: number,
  ): string {
    const shift =
      this.loadedSchedule()[
        day.key as AvailabilityDayKey
      ]?.[index];

    if (this.hasLoadedAvailability()) {
      return shift?.end ?? '';
    }

    return index === 0
      ? day.shiftOne.end
      : day.shiftTwo.end;
  }

  protected hasSecondShift(
    day: AvailabilityDayDefaults,
  ): boolean {
    return (
      (this.loadedSchedule()[
        day.key as AvailabilityDayKey
      ]?.length ?? 0) > 1
    );
  }

  protected isSecondShiftEnabled(
    day: AvailabilityDayDefaults,
  ): boolean {
    if (!this.hasLoadedAvailability()) {
      return day.shiftTwo.enabled;
    }

    return (
      this.hasSecondShift(day) &&
      !this.disabledSecondShifts()[day.key]
    );
  }

  protected setSecondShiftEnabled(
    day: AvailabilityDayDefaults,
    enabled: boolean,
  ): void {
    if (
      !this.hasLoadedAvailability() ||
      !this.isDayEnabled(day.key) ||
      !this.hasSecondShift(day) ||
      this.availabilitySaving()
    ) {
      return;
    }

    this.disabledSecondShifts.update((current) => ({
      ...current,
      [day.key]: !enabled,
    }));

    this.clearSaveFeedback();
  }

  protected isDayEnabled(day: string): boolean {
    return this.enabledDays()[day] ?? false;
  }

  protected setDayEnabled(
    day: string,
    enabled: boolean,
  ): void {
    if (this.availabilitySaving()) {
      return;
    }

    this.enabledDays.update((current) => ({
      ...current,
      [day]: enabled,
    }));

    this.clearSaveFeedback();
  }

  private getEnabledIntervals():
    readonly AvailabilityInterval[] {
    if (!this.loadedAvailability) {
      return [];
    }

    const intervals =
      this.loadedAvailability.intervals;

    const entries = intervals.map((interval, index) => {
      const schedule =
        mapAvailabilityIntervalsToWeek(
          [interval],
          this.clinicTimeZone,
        );

      const dayKey =
        Object.keys(schedule)[0] as
          | AvailabilityDayKey
          | undefined;

      const startTime = dayKey
        ? schedule[dayKey]?.[0]?.start ?? ''
        : '';

      return {
        index,
        dayKey,
        startTime,
      };
    });

    const excludedIndexes = new Set<number>();

    for (const day of this.weekDays) {
      const dayEntries = entries
        .filter((entry) => entry.dayKey === day.key)
        .sort(
          (left, right) =>
            left.startTime.localeCompare(
              right.startTime,
            ) || left.index - right.index,
        );

      if (!this.isDayEnabled(day.key)) {
        for (const entry of dayEntries) {
          excludedIndexes.add(entry.index);
        }
      } else if (
        !this.isSecondShiftEnabled(day) &&
        dayEntries.length > 1
      ) {
        excludedIndexes.add(dayEntries[1].index);
      }
    }

    return intervals.filter(
      (_interval, index) =>
        !excludedIndexes.has(index),
    );
  }

  private applyAvailability(
    availability: DentistAvailability,
  ): void {
    const schedule =
      mapAvailabilityIntervalsToWeek(
        availability.intervals,
        this.clinicTimeZone,
      );

    this.loadedSchedule.set(schedule);
    this.hasLoadedAvailability.set(true);
    this.disabledSecondShifts.set({});

    this.enabledDays.set(
      Object.fromEntries(
        DEFAULT_WEEKLY_AVAILABILITY.map((day) => [
          day.key,
          (
            schedule[
              day.key as AvailabilityDayKey
            ]?.length ?? 0
          ) > 0,
        ]),
      ),
    );
  }

  private resetNewShiftForm(): void {
    this.newShiftDate.set('');
    this.newShiftStart.set('');
    this.newShiftEnd.set('');
    this.newShiftError.set(null);
    this.newShiftSuccess.set(false);
  }

  private clearSaveFeedback(): void {
    this.availabilitySaveSuccess.set(false);
    this.availabilitySaveError.set(null);
  }

  private resetEnabledDays(): void {
    this.enabledDays.set(
      Object.fromEntries(
        DEFAULT_WEEKLY_AVAILABILITY.map((day) => [
          day.key,
          day.enabled,
        ]),
      ),
    );
  }
}
