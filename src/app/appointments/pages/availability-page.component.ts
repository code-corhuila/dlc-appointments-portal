import {
  ChangeDetectionStrategy,
  Component,
  signal,
} from '@angular/core';

@Component({
  selector: 'app-availability-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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

        <select id="dentist" data-dentist-select>
          <option value="">Seleccione un odontólogo</option>
        </select>
      </section>

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

                <label [for]="day.key + '-shift-one-start'">Desde:</label>

                <input
                  [id]="day.key + '-shift-one-start'"
                  type="time"
                  value="08:00"
                  data-shift-one-start
                  [disabled]="!isDayEnabled(day.key)"
                />

                <label [for]="day.key + '-shift-one-end'">Hasta:</label>

                <input
                  [id]="day.key + '-shift-one-end'"
                  type="time"
                  value="12:00"
                  data-shift-one-end
                  [disabled]="!isDayEnabled(day.key)"
                />
              </div>

              <div class="second-shift-toggle">
                <input
                  type="checkbox"
                  [id]="day.key + '-second-shift'"
                  checked
                  [disabled]="!isDayEnabled(day.key)"
                />

                <label [for]="day.key + '-second-shift'">
                  + Segundo Turno (Tarde)
                </label>
              </div>

              <div class="shift-row">
                <strong class="shift-badge">Turno 2:</strong>

                <label [for]="day.key + '-shift-two-start'">Desde:</label>

                <input
                  [id]="day.key + '-shift-two-start'"
                  type="time"
                  value="14:00"
                  data-shift-two-start
                  [disabled]="!isDayEnabled(day.key)"
                />

                <label [for]="day.key + '-shift-two-end'">Hasta:</label>

                <input
                  [id]="day.key + '-shift-two-end'"
                  type="time"
                  value="18:00"
                  data-shift-two-end
                  [disabled]="!isDayEnabled(day.key)"
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
                  <option value="30">30 Min</option>
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

          <p>
            Zona horaria: <strong>America/Bogota</strong>
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
  protected readonly weekDays = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
  ] as const;

  private readonly enabledDays = signal<Record<string, boolean>>({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
  });

  protected isDayEnabled(day: string): boolean {
    return this.enabledDays()[day] ?? false;
  }

  protected setDayEnabled(day: string, enabled: boolean): void {
    this.enabledDays.update((current) => ({
      ...current,
      [day]: enabled,
    }));
  }
}