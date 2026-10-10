import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

import { DENTIST_OWN_CALENDAR_DEMO, DentistOwnAppointmentDemo } from '../data/dentist-own-calendar-demo.data';
import { buildCalendarDays } from '../domain/calendar-grid';

const MONTH_NAMES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'] as const;
const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const;

@Component({
  selector: 'app-dentist-own-calendar', standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './calendar-page.component.css',
  styles: [`
    .calendar-day { display: block; padding: 8px; } .own-day-number { font-weight: 700; }
    .own-appointment { display: block; width: 100%; margin-top: 6px; padding: 4px; border-radius: 3px; text-align: left; font-size: 10px; }
    .own-appointment[data-status='PROGRAMADA'] { background: #cfe0ff; color: #1554a3; }
    .own-appointment[data-status='FINALIZADA'] { background: #e7f6f4; color: #0f766e; }
    .own-appointment[aria-pressed='true'], .own-day-number[aria-pressed='true'] { outline: 2px solid var(--focus); }
  `],
  template: `
    <main class="calendar-page" aria-labelledby="dentist-own-calendar-title">
      <header class="calendar-header">
        <div class="calendar-heading"><h1 id="dentist-own-calendar-title">Mi calendario</h1><p>Consulta tus citas programadas y realizadas. <span data-own-calendar-demo>Datos demostrativos</span></p></div>
        <div class="period-navigation"><button type="button" aria-label="Periodo anterior" (click)="navigateMonth(-1)">‹</button><strong data-own-calendar-period>{{ periodLabel() }}</strong><button type="button" aria-label="Periodo siguiente" (click)="navigateMonth(1)">›</button></div>
      </header>
      <section class="calendar-layout">
        <div class="calendar-main">
          <div class="calendar-view-controls"><label class="view-switcher">Perfil demostrativo <select data-demo-dentist [value]="demoDentistId()" (change)="setDemoDentist($any($event.target).value)"><option value="dentist-own-demo-001">Odontóloga A</option><option value="dentist-own-demo-002">Odontóloga B</option></select></label></div>
          <section class="calendar-card" aria-label="Calendario mensual propio">
            <div class="calendar-weekdays">@for (weekday of weekdays; track weekday) { <span>{{ weekday }}</span> }</div>
            <div class="calendar-grid">@for (day of days(); track day.date) {
              <div class="calendar-day" [attr.data-current-month]="day.isCurrentMonth"><button type="button" class="own-day-number" data-own-calendar-day [attr.data-date]="day.date" [attr.aria-pressed]="selectedDate() === day.date" (click)="selectDay(day.date)">{{ dayNumber(day.date) }}</button>
                @for (item of appointmentsForDate(day.date); track item.appointment.id) { <button type="button" class="own-appointment" data-own-calendar-appointment [attr.data-appointment-id]="item.appointment.id" [attr.data-status]="item.appointment.status" [attr.aria-pressed]="selectedAppointment()?.appointment?.id === item.appointment.id" (click)="selectAppointment(item)">{{ formatTime(item.appointment.startAt) }} · {{ item.appointment.status }}</button> }
              </div>
            }</div>
          </section>
        </div>
        <aside class="calendar-sidebar" aria-label="Información de mis citas">
          <section class="calendar-panel treatment-panel"><h2>Mis citas del día</h2>
            @if (appointmentsForDate(selectedDate()).length) { <ul class="treatment-list">@for (item of appointmentsForDate(selectedDate()); track item.appointment.id) { <li>{{ formatTime(item.appointment.startAt) }} · {{ item.patientDisplayName }} · {{ item.appointment.status }}</li> }</ul> } @else { <p>No tienes citas programadas para este día.</p> }
          </section>
          @if (selectedAppointment(); as item) { <section class="calendar-panel selected-appointment-panel" data-own-appointment-detail><h2>Detalle de cita</h2><dl>
            <div><dt>Paciente</dt><dd>{{ item.patientDisplayName }}</dd></div><div><dt>Fecha</dt><dd>{{ formatDate(item.appointment.startAt) }}</dd></div><div><dt>Horario</dt><dd>{{ formatTime(item.appointment.startAt) }} – {{ formatTime(item.appointment.endAt) }}</dd></div><div><dt>Estado</dt><dd>{{ item.appointment.status }}</dd></div><div><dt>Referencia</dt><dd>{{ item.appointment.id }}</dd></div>
          </dl></section> }
        </aside>
      </section>
    </main>
  `,
})
export class DentistOwnCalendarComponent {
  readonly weekdays = WEEKDAYS;
  readonly demoDentistId = signal('dentist-own-demo-001');
  readonly anchorDate = signal('2026-10-15');
  readonly selectedDate = signal('2026-10-15');
  readonly selectedAppointment = signal<DentistOwnAppointmentDemo | null>(null);
  readonly appointments = computed(() => DENTIST_OWN_CALENDAR_DEMO.filter((item) => item.appointment.dentistId === this.demoDentistId()));
  readonly days = computed(() => buildCalendarDays(this.anchorDate(), 'month'));
  readonly periodLabel = computed(() => { const [year, month] = this.anchorDate().split('-').map(Number); return `${MONTH_NAMES[month - 1][0].toUpperCase()}${MONTH_NAMES[month - 1].slice(1)} ${year}`; });

  appointmentsForDate(date: string): readonly DentistOwnAppointmentDemo[] { return this.appointments().filter((item) => item.appointment.startAt.startsWith(date)); }
  dayNumber(date: string): number { return Number(date.slice(-2)); }
  formatTime(value: string): string { const hour = Number(value.slice(11, 13)); return `${hour % 12 || 12}:${value.slice(14, 16)} ${hour < 12 ? 'a. m.' : 'p. m.'}`; }
  formatDate(value: string): string { const [year, month, day] = value.slice(0, 10).split('-').map(Number); return `${day} de ${MONTH_NAMES[month - 1]} de ${year}`; }
  setDemoDentist(id: string): void { if (id === 'dentist-own-demo-001' || id === 'dentist-own-demo-002') { this.demoDentistId.set(id); this.selectedAppointment.set(null); this.selectedDate.set(this.anchorDate()); } }
  selectDay(date: string): void { this.selectedDate.set(date); this.selectedAppointment.set(null); }
  selectAppointment(item: DentistOwnAppointmentDemo): void { this.selectedDate.set(item.appointment.startAt.slice(0, 10)); this.selectedAppointment.set(item); }
  navigateMonth(direction: -1 | 1): void { const [year, month] = this.anchorDate().split('-').map(Number); const next = new Date(Date.UTC(year, month - 1 + direction, 1)); const date = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-01`; this.anchorDate.set(date); this.selectedDate.set(date); this.selectedAppointment.set(null); }
}
