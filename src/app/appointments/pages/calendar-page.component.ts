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
  private readonly monthNames = [
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

  private readonly anchorDate = signal('2026-10-15');

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
      this.anchorDate(),
      this.view(),
    ),
  );

  readonly periodLabel = computed(() => {
    if (this.view() === 'month') {
      const date = this.parseDate(this.anchorDate());
      const month = this.monthNames[date.getUTCMonth()];

      return `${this.capitalize(month)} ${date.getUTCFullYear()}`;
    }

    const days = this.days();
    const firstDay = this.parseDate(days[0].date);
    const lastDay = this.parseDate(days[days.length - 1].date);

    const firstMonth = this.monthNames[firstDay.getUTCMonth()];
    const lastMonth = this.monthNames[lastDay.getUTCMonth()];
    const firstYear = firstDay.getUTCFullYear();
    const lastYear = lastDay.getUTCFullYear();

    if (
      firstMonth === lastMonth &&
      firstYear === lastYear
    ) {
      return `${firstDay.getUTCDate()} – ${lastDay.getUTCDate()} de ${firstMonth} de ${firstYear}`;
    }

    if (firstYear === lastYear) {
      return `${firstDay.getUTCDate()} de ${firstMonth} – ${lastDay.getUTCDate()} de ${lastMonth} de ${firstYear}`;
    }

    return `${firstDay.getUTCDate()} de ${firstMonth} de ${firstYear} – ${lastDay.getUTCDate()} de ${lastMonth} de ${lastYear}`;
  });

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
    if (this.view() === 'month') {
      this.anchorDate.set(
        this.shiftMonth(
          this.anchorDate(),
          direction,
        ),
      );

      return;
    }

    this.anchorDate.set(
      this.shiftDays(
        this.anchorDate(),
        direction * 7,
      ),
    );
  }

  private shiftMonth(
    date: string,
    direction: -1 | 1,
  ): string {
    const current = this.parseDate(date);

    const targetStart = new Date(
      Date.UTC(
        current.getUTCFullYear(),
        current.getUTCMonth() + direction,
        1,
      ),
    );

    const lastDayOfTargetMonth = new Date(
      Date.UTC(
        targetStart.getUTCFullYear(),
        targetStart.getUTCMonth() + 1,
        0,
      ),
    ).getUTCDate();

    const targetDay = Math.min(
      current.getUTCDate(),
      lastDayOfTargetMonth,
    );

    targetStart.setUTCDate(targetDay);

    return this.formatDate(targetStart);
  }

  private shiftDays(
    date: string,
    amount: number,
  ): string {
    const shifted = this.parseDate(date);

    shifted.setUTCDate(
      shifted.getUTCDate() + amount,
    );

    return this.formatDate(shifted);
  }

  private parseDate(date: string): Date {
    const [year, month, day] = date
      .split('-')
      .map(Number);

    return new Date(
      Date.UTC(
        year,
        month - 1,
        day,
      ),
    );
  }

  private formatDate(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(
      date.getUTCMonth() + 1,
    ).padStart(2, '0');
    const day = String(
      date.getUTCDate(),
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private capitalize(value: string): string {
    return (
      value.charAt(0).toUpperCase() +
      value.slice(1)
    );
  }
}