import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import {
  CALENDAR_SUPPORT_DATA_SOURCE,
} from '../data/calendar-support-data-source';
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
  styleUrl: './calendar-page.component.css',
  template: `
    <main class="calendar-page">
      <header class="calendar-header">
        <div class="calendar-heading">
          <h1>Calendario de Citas</h1>

          <p>
            Consulta tu agenda de citas.
            <span>America/Bogota</span>
          </p>
        </div>

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
      </header>

      <section class="calendar-layout">
        <div class="calendar-main">
          <div class="calendar-view-controls">
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
        </div>

        <aside
          class="calendar-sidebar"
          aria-label="Información del calendario"
        >
          <section
            class="calendar-panel treatment-panel"
            data-demo-fixture
          >
            <h2>Tratamientos</h2>

            <ul class="treatment-list">
              @for (
                treatment of treatmentLegend;
                track treatment.name
              ) {
                <li>
                  <span
                    class="treatment-dot"
                    [attr.data-treatment]="treatment.key"
                  ></span>

                  <span>{{ treatment.name }}</span>
                </li>
              }
            </ul>
          </section>

          <section
            class="calendar-panel waiting-list-panel"
            data-demo-fixture
          >
            <header class="waiting-list-header">
              <h2>Lista de Espera</h2>

              <span class="waiting-count">
                {{ waitingList.length }}
              </span>
            </header>

            <div class="waiting-list">
              @for (
                patient of waitingList;
                track patient.name
              ) {
                <article class="waiting-card">
                  <div class="waiting-card-heading">
                    <strong>
                      {{ patient.name }}
                    </strong>

                    <span
                      class="treatment-tag"
                      [attr.data-treatment]="patient.treatmentKey"
                    >
                      {{ patient.treatment }}
                    </span>
                  </div>

                  <p>
                    {{ patient.preference }}
                  </p>

                  <button
                    type="button"
                    class="assign-button"
                    disabled
                    aria-disabled="true"
                  >
                    Asignar Turno
                  </button>
                </article>
              }
            </div>
          </section>
        </aside>
      </section>
    </main>
  `,
})
export class CalendarPageComponent {
  private readonly supportDataSource = inject(
    CALENDAR_SUPPORT_DATA_SOURCE,
  );

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

  readonly treatmentLegend =
    this.supportDataSource.treatmentLegend;

  readonly waitingList =
    this.supportDataSource.waitingList;

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