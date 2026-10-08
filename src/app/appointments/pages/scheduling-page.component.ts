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
  styleUrl: './scheduling-page.component.css',
  template: `
    <main class="scheduling-page">
      <header>
        <h1>Agendar Nueva Cita</h1>
        <p>
          Complete los detalles para programar una cita.
        </p>
      </header>

      <section>
        <h2>1. Paciente</h2>

        <label for="patient-search">
          Buscar paciente
        </label>

        <input
          id="patient-search"
          type="search"
          placeholder="Buscar por nombre o documento"
        />
      </section>

      <section>
        <h2>2. Fecha y horario</h2>

        <label for="appointment-date">
          Fecha
        </label>

        <input
          id="appointment-date"
          type="date"
          (change)="
            selectDate(
              $any($event.target).value
            )
          "
        />

        <h3>Horarios disponibles</h3>

        <div>
          @for (
            slot of availableSlots();
            track slot.startAt
          ) {
            <button
              type="button"
              data-available-slot
              [attr.aria-pressed]="
                selectedSlot()?.startAt ===
                slot.startAt
              "
              (click)="selectSlot(slot)"
            >
              {{ slot.label }}
            </button>
          }
        </div>

        <p>
          Zona horaria:
          <strong>{{ clinicTimeZone }}</strong>
        </p>
      </section>

      <section>
        <h2>3. Odontólogo</h2>

        <label for="dentist">
          Seleccionar odontólogo
        </label>

        <select
          id="dentist"
          (change)="
            selectDentist(
              $any($event.target).value
            )
          "
        >
          <option value="">
            Seleccione un odontólogo
          </option>
        </select>
      </section>

      <section>
        <h2>4. Motivo</h2>

        <label for="reason">
          Motivo de la cita
        </label>

        <textarea
          id="reason"
          placeholder="Escriba el motivo principal de la cita"
        ></textarea>
      </section>

      <aside>
        <h2>Resumen de Cita</h2>

        <p>Paciente: No seleccionado</p>
        <p>Odontólogo: No seleccionado</p>

        <p data-selected-slot>
          Fecha y hora:
          {{
            selectedSlot()?.label ??
              'No seleccionada'
          }}
        </p>

        <button
          type="button"
          data-confirm-appointment
        >
          Confirmar Cita
        </button>
      </aside>
    </main>
  `,
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