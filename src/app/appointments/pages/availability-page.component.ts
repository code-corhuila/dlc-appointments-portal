import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';

@Component({
  selector: 'app-availability-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="availability-page">
      <header>
        <h1>Horarios y Slots de Disponibilidad</h1>
        <p>
          Configure la disponibilidad semanal y genere los horarios
          disponibles para reserva.
        </p>
      </header>

      <section>
        <h2>Odontólogo</h2>

        <label for="dentist">
          Seleccionar odontólogo
        </label>

        <select
          id="dentist"
          data-dentist-select
        >
          <option value="">
            Seleccione un odontólogo
          </option>
        </select>
      </section>

      <section data-weekly-schedule>
        <h2>Configurar Horario Semanal</h2>

        <p>
          Defina las horas de atención para cada día de la semana.
        </p>

        <div>
          <strong>Lunes</strong>
          <span>08:00 AM - 12:00 PM</span>
        </div>

        <div>
          <strong>Martes</strong>
          <span>08:00 AM - 12:00 PM</span>
        </div>

        <div>
          <strong>Miércoles</strong>
          <span>08:00 AM - 12:00 PM</span>
        </div>
      </section>

      <section>
        <h2>Duración del Slot</h2>

        <label for="slot-duration">
          Duración
        </label>

        <select
          id="slot-duration"
          data-slot-duration
        >
          <option value="30">
            30 minutos
          </option>
        </select>

        <p>
          Zona horaria:
          <strong>America/Bogota</strong>
        </p>
      </section>

      <section>
        <h2>Generador de Slots</h2>

        <label for="start-date">
          Fecha de inicio
        </label>

        <input
          id="start-date"
          type="date"
          data-start-date
        />

        <label for="end-date">
          Fecha de fin
        </label>

        <input
          id="end-date"
          type="date"
          data-end-date
        />

        <button
          type="button"
          data-generate-slots
        >
          Generar Slots de Disponibilidad
        </button>
      </section>

      <section>
        <h2>Slots generados</h2>

        <p data-slots-empty>
          No hay slots generados.
        </p>
      </section>
    </main>
  `,
})
export class AvailabilityPageComponent {}