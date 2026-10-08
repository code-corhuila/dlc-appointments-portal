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
import {
  AvailabilityDayDefaults,
  AvailabilityDayKey,
  AvailabilityTimeField,
  DEFAULT_SLOT_DURATION_MINUTES,
  DEFAULT_WEEKLY_AVAILABILITY,
  mapAvailabilityIntervalsToWeek,
  updateAvailabilityIntervalTime,
  WeeklyAvailabilitySchedule,
} from '../domain/availability-schedule';
import { CLINIC_TIME_ZONE } from '../domain/clinic-time';
import { ApiError } from '../model/api-error';
import { DentistAvailability } from '../model/availability';

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
                  (change)="setDayEnabled(day.key, $any($event.target).checked)"
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
                  [disabled]="!isDayEnabled(day.key)"
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
                  [disabled]="!isDayEnabled(day.key)"
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
                  [disabled]="!isDayEnabled(day.key)"
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
                  [disabled]="!isDayEnabled(day.key)"
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
                  [disabled]="!isDayEnabled(day.key)"
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
                  [disabled]="!isDayEnabled(day.key)"
                >
                  <option [value]="slotDurationMinutes">
                    {{ slotDurationMinutes }} Min
                  </option>
                </select>
              </div>
            </article>
          }

          <button
            type="button"
            data-save-availability
            [disabled]="availabilitySaving()"
            (click)="saveAvailability()"
          >
            Guardar Configuración Semanal
          </button>
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

          <p>
            Zona horaria: <strong>{{ clinicTimeZone }}</strong>
          </p>
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
  protected readonly clinicTimeZone = CLINIC_TIME_ZONE;

  protected readonly availabilityLoading = signal(false);
  protected readonly availabilitySaving = signal(false);
  protected readonly availabilityEmpty = signal(false);
  protected readonly availabilityError =
    signal<ApiError | null>(null);

  private readonly loadedSchedule =
    signal<WeeklyAvailabilitySchedule>({});

  private readonly hasLoadedAvailability = signal(false);

  private selectedDentistId: string | null = null;

  private readonly enabledDays = signal<Record<string, boolean>>(
    Object.fromEntries(
      DEFAULT_WEEKLY_AVAILABILITY.map((day) => [
        day.key,
        day.enabled,
      ]),
    ),
  );

  protected loadAvailability(dentistId: string): void {
    this.availabilityRequest?.unsubscribe();

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
        error: (error: ApiError) => {
          this.loadedAvailability = null;
          this.availabilityEmpty.set(false);
          this.availabilityError.set(error);
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

  protected saveAvailability(): void {
    if (
      !this.selectedDentistId ||
      !this.loadedAvailability ||
      this.availabilitySaving()
    ) {
      return;
    }

    const currentAvailability =
      this.loadedAvailability;

    this.availabilitySaving.set(true);

    this.api
      .updateDentistAvailability(
        this.selectedDentistId,
        {
          intervals:
            currentAvailability.intervals,
          blockedIntervals:
            currentAvailability.blockedIntervals,
          expectedVersion:
            currentAvailability.version,
        },
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.availabilitySaving.set(false);
        }),
      )
      .subscribe({
        next: (updatedAvailability) => {
          this.loadedAvailability =
            updatedAvailability;

          this.applyAvailability(
            updatedAvailability,
          );

          this.availabilityEmpty.set(
            updatedAvailability.intervals.length === 0,
          );
        },
      });
  }

  protected updateShiftTime(
    dayKey: string,
    shiftIndex: number,
    field: AvailabilityTimeField,
    time: string,
  ): void {
    if (!this.loadedAvailability) {
      return;
    }

    const intervals =
      updateAvailabilityIntervalTime(
        this.loadedAvailability.intervals,
        dayKey as AvailabilityDayKey,
        shiftIndex,
        field,
        time,
      );

    this.loadedAvailability = {
      ...this.loadedAvailability,
      intervals,
    };

    this.loadedSchedule.set(
      mapAvailabilityIntervalsToWeek(
        intervals,
      ),
    );
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

  protected isSecondShiftEnabled(
    day: AvailabilityDayDefaults,
  ): boolean {
    if (!this.hasLoadedAvailability()) {
      return day.shiftTwo.enabled;
    }

    return (
      (this.loadedSchedule()[
        day.key as AvailabilityDayKey
      ]?.length ?? 0) > 1
    );
  }

  protected isDayEnabled(day: string): boolean {
    return this.enabledDays()[day] ?? false;
  }

  protected setDayEnabled(
    day: string,
    enabled: boolean,
  ): void {
    this.enabledDays.update((current) => ({
      ...current,
      [day]: enabled,
    }));
  }

  private applyAvailability(
    availability: DentistAvailability,
  ): void {
    const schedule =
      mapAvailabilityIntervalsToWeek(
        availability.intervals,
      );

    this.loadedSchedule.set(schedule);
    this.hasLoadedAvailability.set(true);

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