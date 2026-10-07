import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';

@Component({
  selector: 'app-scheduling-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
        />

        <h3>Horarios disponibles</h3>

        <p>
          Zona horaria:
          <strong>America/Bogota</strong>
        </p>
      </section>

      <section>
        <h2>3. Odontólogo</h2>

        <label for="dentist">
          Seleccionar odontólogo
        </label>

        <select id="dentist">
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
        <p>Fecha y hora: No seleccionada</p>

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
export class SchedulingPageComponent {}