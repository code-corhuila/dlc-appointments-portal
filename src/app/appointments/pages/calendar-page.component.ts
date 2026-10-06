import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';

@Component({
  selector: 'app-calendar-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="calendar-page">
      <header class="calendar-header">
        <div>
          <h1>Calendario de Citas</h1>

          <p>
            Consulta tu agenda de citas.
            <span>America/Bogota</span>
          </p>
        </div>

        <div class="calendar-toolbar">
          <div class="period-navigation">
            <button
              type="button"
              aria-label="Periodo anterior"
            >
              ‹
            </button>

            <strong>Octubre 2026</strong>

            <button
              type="button"
              aria-label="Periodo siguiente"
            >
              ›
            </button>
          </div>

          <div
            class="view-switcher"
            aria-label="Vista del calendario"
          >
            <button
              type="button"
              data-calendar-view="month"
            >
              Mes
            </button>

            <button
              type="button"
              data-calendar-view="week"
            >
              Semana
            </button>
          </div>
        </div>
      </header>

      <section class="calendar-layout">
        <section
          class="calendar-card"
          aria-label="Calendario de citas"
        >
          <div class="calendar-weekdays">
            @for (weekday of weekdays; track weekday) {
              <span data-weekday>
                {{ weekday }}
              </span>
            }
          </div>

          <div
            class="calendar-grid"
            aria-label="Días del calendario"
          ></div>
        </section>

        <aside
          class="calendar-sidebar"
          aria-label="Información del calendario"
        >
          <section class="calendar-panel">
            <h2>Estados de cita</h2>
          </section>

          <section class="calendar-panel">
            <h2>Citas del día</h2>
          </section>
        </aside>
      </section>
    </main>
  `,
})
export class CalendarPageComponent {
  readonly weekdays = [
    'Dom',
    'Lun',
    'Mar',
    'Mié',
    'Jue',
    'Vie',
    'Sáb',
  ] as const;
}