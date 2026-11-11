import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';

import { ApiErrorAlertComponent } from '../components/api-error-alert.component';
import { AppointmentsApiService } from '../data/appointments-api.service';
import { CalendarDataSource } from '../data/calendar-data-source';
import { CLINIC_CLOCK } from '../data/clinic-clock';
import { PatientsLookupService } from '../data/patients-lookup.service';
import { buildCalendarDays } from '../domain/calendar-grid';
import { clinicToday, toClinicLocalDateTime } from '../domain/clinic-time';
import { ApiError } from '../model/api-error';
import { Appointment } from '../model/appointment';
import { SHELL_CONTEXT } from '../../shell-contract';

const MONTH_NAMES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'] as const;
const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const;
const NO_ACCESS = 'Paciente sin acceso';

/** The signed-in dentist's own appointments (HU-APT-003), read from the Appointments API at clinic time. */
@Component({
  selector: 'app-dentist-own-calendar', standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ApiErrorAlertComponent],
  styleUrl: './calendar-page.component.css',
  styles: [`
    .calendar-day { display: block; padding: 8px; } .own-day-number { font-weight: 700; }
    .own-appointment { display: block; width: 100%; margin-top: 6px; padding: 4px; border-radius: 3px; text-align: left; font-size: 10px; }
    .own-appointment[data-status='PROGRAMADA'] { background: #cfe0ff; color: #1554a3; }
    .own-appointment[data-status='FINALIZADA'] { background: #e7f6f4; color: #0f766e; }
    .own-appointment[aria-pressed='true'], .own-day-number[aria-pressed='true'] { outline: 2px solid var(--focus); }
    .clinical-action { display: inline-block; padding: 9px 12px; border-radius: 4px; background: #0f766e; color: white; font-weight: 700; }
    .attention-instructions { color: #59646d; line-height: 1.4; }
  `],
  template: `
    <main class="calendar-page" aria-labelledby="dentist-own-calendar-title">
      <header class="calendar-header">
        <div class="calendar-heading"><h1 id="dentist-own-calendar-title">Mi calendario</h1><p>Consulta tus citas programadas y realizadas. <span>America/Bogota</span></p></div>
        <div class="period-navigation"><button type="button" aria-label="Periodo anterior" (click)="navigateMonth(-1)">‹</button><strong data-own-calendar-period>{{ periodLabel() }}</strong><button type="button" aria-label="Periodo siguiente" (click)="navigateMonth(1)">›</button></div>
      </header>
      @if (loadError(); as error) { <app-api-error-alert [error]="error" /> }
      <section class="calendar-layout">
        <div class="calendar-main">
          <section class="calendar-card" aria-label="Calendario mensual propio">
            <div class="calendar-weekdays">@for (weekday of weekdays; track weekday) { <span>{{ weekday }}</span> }</div>
            <div class="calendar-grid">@for (day of days(); track day.date) {
              <div class="calendar-day" [attr.data-current-month]="day.isCurrentMonth"><button type="button" class="own-day-number" data-own-calendar-day [attr.data-date]="day.date" [attr.aria-pressed]="selectedDate() === day.date" (click)="selectDay(day.date)">{{ dayNumber(day.date) }}</button>
                @for (appointment of appointmentsForDate(day.date); track appointment.id) { <button type="button" class="own-appointment" data-own-calendar-appointment [attr.data-appointment-id]="appointment.id" [attr.data-status]="appointment.status" [attr.aria-pressed]="selectedAppointment()?.id === appointment.id" (click)="selectAppointment(appointment)">{{ formatTime(appointment.startAt) }} · {{ appointment.status }}</button> }
              </div>
            }</div>
          </section>
        </div>
        <aside class="calendar-sidebar" aria-label="Información de mis citas">
          <section class="calendar-panel treatment-panel"><h2>Mis citas del día</h2>
            @if (appointmentsForDate(selectedDate()).length) { <ul class="treatment-list">@for (appointment of appointmentsForDate(selectedDate()); track appointment.id) { <li>{{ formatTime(appointment.startAt) }} · {{ patientName(appointment.patientId) }} · {{ appointment.status }}</li> }</ul> } @else { <p>No tienes citas programadas para este día.</p> }
          </section>
          @if (selectedAppointment(); as appointment) { <section class="calendar-panel selected-appointment-panel" data-own-appointment-detail><h2>Detalle de cita</h2><dl>
            <div><dt>Paciente</dt><dd>{{ patientName(appointment.patientId) }}</dd></div><div><dt>Fecha</dt><dd>{{ formatDate(appointment.startAt) }}</dd></div><div><dt>Horario</dt><dd>{{ formatTime(appointment.startAt) }} – {{ formatTime(appointment.endAt) }}</dd></div><div><dt>Estado</dt><dd>{{ appointment.status }}</dd></div><div><dt>Referencia</dt><dd>{{ appointment.id }}</dd></div>
          </dl>
            @if (appointment.status === 'EN_ATENCION') {
              <button type="button" class="clinical-action" data-open-clinical-record (click)="openClinicalRecord(appointment)">Atender paciente</button>
            } @else if (appointment.status === 'CONFIRMADA') {
              <p class="attention-instructions" data-attention-instructions>Solicita a administración que inicie la atención para poder atender al paciente.</p>
            }
          </section> }
        </aside>
      </section>
    </main>
  `,
})
export class DentistOwnCalendarComponent {
  private readonly patients = inject(PatientsLookupService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly shell = inject(SHELL_CONTEXT, { optional: true });
  private readonly dentistId = this.shell?.session.getSnapshot().user?.id;
  private readonly today = clinicToday(inject(CLINIC_CLOCK)());
  private readonly patientNames = signal<Readonly<Record<string, string>>>({});
  readonly weekdays = WEEKDAYS;
  readonly anchorDate = signal(`${this.today.slice(0, 8)}01`);
  readonly selectedDate = signal(this.today);
  readonly selectedAppointment = signal<Appointment | null>(null);
  readonly appointments = signal<readonly Appointment[]>([]);
  readonly loadError = signal<ApiError | null>(null);
  readonly days = computed(() => buildCalendarDays(this.anchorDate(), 'month'));
  readonly periodLabel = computed(() => { const [year, month] = this.anchorDate().split('-').map(Number); return `${MONTH_NAMES[month - 1][0].toUpperCase()}${MONTH_NAMES[month - 1].slice(1)} ${year}`; });

  constructor() {
    const source = new CalendarDataSource(inject(AppointmentsApiService));
    source.errors$.pipe(takeUntilDestroyed()).subscribe((error) => { this.appointments.set([]); this.loadError.set(error); });
    source.connect(toObservable(computed(() => ({ anchorDate: this.anchorDate(), view: 'month' as const, dentistId: this.dentistId }))))
      .pipe(takeUntilDestroyed())
      .subscribe((page) => {
        this.loadError.set(null);
        this.appointments.set(page.data.map((item) => ({ ...item, startAt: toClinicLocalDateTime(item.startAt), endAt: toClinicLocalDateTime(item.endAt) })));
        this.resolvePatients();
      });
  }

  patientName(id: string): string { return this.patientNames()[id] ?? 'Paciente'; }
  appointmentsForDate(date: string): readonly Appointment[] { return this.appointments().filter((item) => item.startAt.startsWith(date)); }
  dayNumber(date: string): number { return Number(date.slice(-2)); }
  formatTime(value: string): string { const hour = Number(value.slice(11, 13)); return `${hour % 12 || 12}:${value.slice(14, 16)} ${hour < 12 ? 'a. m.' : 'p. m.'}`; }
  formatDate(value: string): string { const [year, month, day] = value.slice(0, 10).split('-').map(Number); return `${day} de ${MONTH_NAMES[month - 1]} de ${year}`; }
  selectDay(date: string): void { this.selectedDate.set(date); this.selectedAppointment.set(null); }
  selectAppointment(appointment: Appointment): void { this.selectedDate.set(appointment.startAt.slice(0, 10)); this.selectedAppointment.set(appointment); }
  openClinicalRecord(appointment: Appointment): void {
    if (appointment.status === 'EN_ATENCION') this.shell?.navigation.request({ path: `/app/clinical/${encodeURIComponent(appointment.patientId)}` });
  }
  navigateMonth(direction: -1 | 1): void { const [year, month] = this.anchorDate().split('-').map(Number); const next = new Date(Date.UTC(year, month - 1 + direction, 1)); const date = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-01`; this.anchorDate.set(date); this.selectedDate.set(date); this.selectedAppointment.set(null); }

  /** Names come from Patients, which only answers for the dentist's assigned patients. */
  private resolvePatients(): void {
    const known = this.patientNames();
    const pending = [...new Set(this.appointments().map((item) => item.patientId))].filter((id) => !(id in known));
    for (const id of pending) {
      this.patients.getPatient(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (patient) => this.patientNames.update((names) => ({ ...names, [id]: patient.name })),
        error: () => this.patientNames.update((names) => ({ ...names, [id]: NO_ACCESS })),
      });
    }
  }
}
