import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';

import { StatusBadgeComponent } from '../components/status-badge.component';
import {
  buildCalendarDays,
  CalendarDay,
} from '../domain/calendar-grid';
import { CalendarView } from '../domain/calendar-range';
import { CLINIC_TIME_ZONE } from '../domain/clinic-time';
import { AppointmentStatus } from '../model/appointment';

@Component({
  selector: 'app-calendar-page',
  standalone: true,
  imports: [StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="calendar-page">
      <header class="calendar-header">
        <div>
          <h1>Calendario de Citas</h1>
          <p>Zona horaria: {{ timeZone }}</p>
        </div>

        <div class="view-switcher" aria-label="Vista del calendario">
          <button
            type="button"
            data-calendar-view="month"
            [attr.aria-pressed]="view() === 'month'"
            (click)="setView('month')"
          >
            Mes
          </button>

          <button
            type="button"
            data-calendar-view="week"
            [attr.aria-pressed]="view() === 'week'"
            (click)="setView('week')"
          >
            Semana
          </button>
        </div>
      </header>

      <div class="calendar-card">
        <div class="weekday-row" aria-hidden="true">
          @for (weekday of weekdays; track weekday) {
            <span data-weekday>{{ weekday }}</span>
          }
        </div>

        <div class="calendar-grid">
          @for (day of days(); track day.date) {
            <article
              data-calendar-day
              [attr.data-current-month]="day.isCurrentMonth"
            >
              <time [attr.datetime]="day.date">
                {{ day.date.slice(8, 10) }}
              </time>
            </article>
          }
        </div>
      </div>

      <section class="status-legend" aria-label="Leyenda de estados">
        @for (status of statuses; track status) {
          <app-status-badge [status]="status" />
        }
      </section>
    </section>
  `,
  styles: `
    :host { display: block; }
    .calendar-page { display: grid; gap: 1rem; }
    .calendar-header {
      display: flex; justify-content: space-between;
      gap: 1rem; align-items: center; flex-wrap: wrap;
    }
    h1, p { margin: 0; }
    .view-switcher, .status-legend {
      display: flex; gap: .5rem; flex-wrap: wrap;
    }
    button { min-height: 44px; padding: .5rem 1rem; }
    .calendar-card {
      background: white; border: 1px solid #dbe4e8;
      border-radius: .75rem; overflow: hidden;
    }
    .weekday-row, .calendar-grid {
      display: grid; grid-template-columns: repeat(7, minmax(0, 1fr));
    }
    .weekday-row span {
      padding: .75rem; text-align: center; font-weight: 600;
    }
    [data-calendar-day] {
      min-height: 6rem; padding: .5rem;
      border-top: 1px solid #e6ecef;
      border-right: 1px solid #e6ecef;
    }
    [data-current-month="false"] { opacity: .45; }
  `,
})
export class CalendarPageComponent {
  readonly timeZone = CLINIC_TIME_ZONE;

  readonly weekdays = [
    'Dom',
    'Lun',
    'Mar',
    'Mié',
    'Jue',
    'Vie',
    'Sáb',
  ];

  readonly statuses: readonly AppointmentStatus[] = [
    'PROGRAMADA',
    'CONFIRMADA',
    'EN_ATENCION',
    'FINALIZADA',
    'CANCELADA',
    'NO_ASISTIO',
  ];

  readonly view = signal<CalendarView>('month');

  private readonly anchorDate = getClinicDate();

  readonly days = computed<readonly CalendarDay[]>(() =>
    buildCalendarDays(
      this.anchorDate,
      this.view(),
    ),
  );

  setView(view: CalendarView): void {
    this.view.set(view);
  }
}

function getClinicDate(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINIC_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}