import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';

import { buildCalendarDays } from '../domain/calendar-grid';
import { CalendarView } from '../domain/calendar-range';

const MONTH_NAMES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const;

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
              (click)="previousPeriod()"
            >
              ‹
            </button>

            <strong data-calendar-period>
              {{ periodLabel() }}
            </strong>

            <button
              type="button"
              aria-label="Periodo siguiente"
              (click)="nextPeriod()"
            >
              ›
            </button>
          </div>

          <div
            class="view-switcher"
            aria-label="Vista del calendario"
          >
            @for (option of viewOptions; track option.value) {
              <button
                type="button"
                [attr.data-calendar-view]="option.value"
                [attr.aria-pressed]="view() === option.value"
                (click)="selectView(option.value)"
              >
                {{ option.label }}
              </button>
            }
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
              <span data-weekday>{{ weekday }}</span>
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
  readonly weekdays = [
    'Dom',
    'Lun',
    'Mar',
    'Mié',
    'Jue',
    'Vie',
    'Sáb',
  ] as const;

  readonly viewOptions = [
    { value: 'month', label: 'Mes' },
    { value: 'week', label: 'Semana' },
  ] as const satisfies readonly {
    value: CalendarView;
    label: string;
  }[];

  private readonly anchorDate = signal('2026-10-15');

  readonly view = signal<CalendarView>('month');

  readonly days = computed(() =>
    buildCalendarDays(this.anchorDate(), this.view()),
  );

  readonly periodLabel = computed(() =>
    this.view() === 'month'
      ? this.monthLabel()
      : this.weekLabel(),
  );

  selectView(view: CalendarView): void {
    this.view.set(view);
  }

  previousPeriod(): void {
    this.navigatePeriod(-1);
  }

  nextPeriod(): void {
    this.navigatePeriod(1);
  }

  dayNumber(date: string): number {
    return Number(date.slice(-2));
  }

  private navigatePeriod(direction: -1 | 1): void {
    const date = this.parseDate(this.anchorDate());

    if (this.view() === 'month') {
      const day = date.getUTCDate();

      date.setUTCDate(1);
      date.setUTCMonth(date.getUTCMonth() + direction);

      const lastDay = new Date(
        Date.UTC(
          date.getUTCFullYear(),
          date.getUTCMonth() + 1,
          0,
        ),
      ).getUTCDate();

      date.setUTCDate(Math.min(day, lastDay));
    } else {
      date.setUTCDate(date.getUTCDate() + direction * 7);
    }

    this.anchorDate.set(this.formatDate(date));
  }

  private monthLabel(): string {
    const date = this.parseDate(this.anchorDate());

    return `${this.capitalize(
      MONTH_NAMES[date.getUTCMonth()],
    )} ${date.getUTCFullYear()}`;
  }

  private weekLabel(): string {
    const days = this.days();
    const first = this.parseDate(days[0].date);
    const last = this.parseDate(days[days.length - 1].date);

    const firstMonth = MONTH_NAMES[first.getUTCMonth()];
    const lastMonth = MONTH_NAMES[last.getUTCMonth()];

    if (
      first.getUTCMonth() === last.getUTCMonth() &&
      first.getUTCFullYear() === last.getUTCFullYear()
    ) {
      return `${first.getUTCDate()} – ${last.getUTCDate()} de ${firstMonth} de ${first.getUTCFullYear()}`;
    }

    if (first.getUTCFullYear() === last.getUTCFullYear()) {
      return `${first.getUTCDate()} de ${firstMonth} – ${last.getUTCDate()} de ${lastMonth} de ${first.getUTCFullYear()}`;
    }

    return `${first.getUTCDate()} de ${firstMonth} de ${first.getUTCFullYear()} – ${last.getUTCDate()} de ${lastMonth} de ${last.getUTCFullYear()}`;
  }

  private parseDate(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);

    return new Date(Date.UTC(year, month - 1, day));
  }

  private formatDate(date: Date): string {
    return [
      date.getUTCFullYear(),
      String(date.getUTCMonth() + 1).padStart(2, '0'),
      String(date.getUTCDate()).padStart(2, '0'),
    ].join('-');
  }

  private capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
