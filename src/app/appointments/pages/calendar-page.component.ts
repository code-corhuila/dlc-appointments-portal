import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';

import { buildCalendarDays } from '../domain/calendar-grid';
import { CalendarView } from '../domain/calendar-range';

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
              [attr.aria-pressed]="view() === 'month'"
              (click)="selectView('month')"
            >
              Mes
            </button>

            <button
              type="button"
              data-calendar-view="week"
              [attr.aria-pressed]="view() === 'week'"
              (click)="selectView('week')"
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
          >
            @for (day of days(); track day.date) {
              <button
                type="button"
                class="calendar-day"
                data-calendar-day
                [attr.data-date]="day.date"
                [attr.data-current-month]="day.isCurrentMonth"
              >
                {{ dayNumber(day.date) }}
              </button>
            }
          </div>
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
  private readonly anchorDate = '2026-10-15';

  readonly weekdays = [
    'Dom',
    'Lun',
    'Mar',
    'Mié',
    'Jue',
    'Vie',
    'Sáb',
  ] as const;

  readonly view = signal<CalendarView>('month');

  readonly days = computed(() =>
    buildCalendarDays(
      this.anchorDate,
      this.view(),
    ),
  );

  selectView(view: CalendarView): void {
    this.view.set(view);
  }

  dayNumber(date: string): number {
    return Number(date.slice(-2));
  }
}