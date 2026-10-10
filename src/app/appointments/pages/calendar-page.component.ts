import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import {
  CALENDAR_SUPPORT_DATA_SOURCE,
  WaitingListItem,
} from '../data/calendar-support-data-source';
import { CalendarAppointmentDemoService } from '../data/calendar-appointment-demo.service';
import { AppointmentsApiService } from '../data/appointments-api.service';
import { buildCalendarDays } from '../domain/calendar-grid';
import { CalendarView } from '../domain/calendar-range';
import { Appointment } from '../model/appointment';
import { AppointmentActionsComponent } from './appointment-actions.component';

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
  imports: [AppointmentActionsComponent],
  providers: [
    {
      provide: AppointmentsApiService,
      useClass: CalendarAppointmentDemoService,
    },
  ],
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
                <div class="calendar-day" data-calendar-day [attr.data-date]="day.date" [attr.data-current-month]="day.isCurrentMonth">
                  <button type="button" (click)="selectAppointmentForDate(day.date)">{{ dayNumber(day.date) }}</button>
                  @for (appointment of appointmentsForDate(day.date).slice(0, 3); track appointment.id) {
                    <button type="button" class="calendar-appointment-label" [attr.data-calendar-appointment]="appointment.id" (click)="selectAppointment(appointment)">
                      {{ appointment.startAt.slice(11, 16) }} · {{ appointment.reason ?? 'Cita' }} · {{ appointment.status }}
                    </button>
                  }
                  @if (appointmentsForDate(day.date).length > 3) { <span class="calendar-appointment-label">+{{ appointmentsForDate(day.date).length - 3 }} más</span> }
                </div>
              }
            </div>
          </section>

          @if (selectedAppointment(); as appointment) {
            <section
              class="calendar-panel selected-appointment-panel"
              data-selected-appointment
              data-demo-fixture
            >
              <h2>Cita seleccionada</h2>
              <p>Demostración visual con datos simulados.</p>
              <dl>
                <div><dt>Referencia</dt><dd>{{ appointment.id }}</dd></div>
                <div><dt>Estado</dt><dd><span class="appointment-status">{{ appointment.status }}</span></dd></div>
                <div><dt>Fecha</dt><dd>{{ formatAppointmentDate(appointment.startAt) }}</dd></div>
                <div><dt>Horario</dt><dd>{{ formatAppointmentTime(appointment.startAt) }} – {{ formatAppointmentTime(appointment.endAt) }}</dd></div>
              </dl>

              <app-appointment-actions
                [appointment]="appointment"
                [canManage]="true"
                [now]="demoNow"
                (appointmentUpdated)="updateAppointment($event)"
              />
            </section>
          }
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
                <span data-waiting-count>{{ waitingList().length }}</span>
              </span>
            </header>

            <div class="waiting-list">
              @for (
                patient of waitingList();
                track patient.id
              ) {
                <article class="waiting-card" data-waiting-patient [attr.data-waiting-patient]="patient.id">
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
                    [attr.data-assign-waiting]="patient.id"
                    (click)="startDemoAssignment(patient)"
                  >
                    Asignar Turno
                  </button>
                  @if (assignmentPatientId() === patient.id) {
                    <select class="demo-assignment-slot" data-demo-assignment-slot [value]="assignmentSlot()" (change)="assignmentSlot.set($any($event.target).value)">
                      <option value="2026-10-20T09:00:00-05:00">20 oct · 9:00 a. m.</option>
                      <option value="2026-10-21T11:00:00-05:00">21 oct · 11:00 a. m.</option>
                    </select>
                    <button type="button" class="demo-assignment-confirm" data-confirm-demo-assignment (click)="confirmDemoAssignment(patient)">Confirmar turno</button>
                  }
                </article>
              }
              @empty { <p data-waiting-empty>No hay pacientes en espera.</p> }
            </div>
            @if (assignmentFeedback()) { <p role="status">{{ assignmentFeedback() }}</p> }
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

  readonly waitingList = signal(this.supportDataSource.waitingList);

  readonly appointments = signal(
    this.supportDataSource.appointments,
  );

  readonly selectedAppointment = signal<Appointment | null>(null);
  readonly assignmentPatientId = signal<string | null>(null);
  readonly assignmentSlot = signal('2026-10-20T09:00:00-05:00');
  readonly assignmentFeedback = signal<string | null>(null);
  readonly demoNow = new Date('2026-10-09T14:00:00-05:00');

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

  formatAppointmentDate(value: string): string {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    return `${day} de ${MONTH_NAMES[month - 1]} de ${year}`;
  }

  formatAppointmentTime(value: string): string {
    const hour = Number(value.slice(11, 13));
    return `${hour % 12 || 12}:${value.slice(14, 16)} ${hour < 12 ? 'a. m.' : 'p. m.'}`;
  }

  appointmentForDate(date: string): Appointment | undefined {
    return this.appointmentsForDate(date)[0];
  }

  appointmentsForDate(date: string): readonly Appointment[] {
    return this.appointments().filter((appointment) =>
      appointment.startAt.startsWith(date),
    );
  }

  selectAppointmentForDate(date: string): void {
    this.selectedAppointment.set(this.appointmentForDate(date) ?? null);
  }

  selectAppointment(appointment: Appointment): void {
    this.selectedAppointment.set(appointment);
  }

  startDemoAssignment(patient: WaitingListItem): void {
    this.assignmentPatientId.set(patient.id);
    this.assignmentFeedback.set(null);
  }

  confirmDemoAssignment(patient: WaitingListItem): void {
    if (this.assignmentPatientId() !== patient.id) return;
    const startAt = this.assignmentSlot();
    const appointment: Appointment = {
      id: `appointment-demo-${patient.id}`, patientId: patient.id,
      dentistId: 'dentist-demo-001', startAt,
      endAt: `${startAt.slice(0, 11)}${String(Number(startAt.slice(11, 13)) + 1).padStart(2, '0')}${startAt.slice(13)}`,
      reason: patient.treatment, status: 'PROGRAMADA', confirmationStatus: 'PENDING', version: 1,
    };
    this.appointments.update((appointments) => [...appointments, appointment]);
    this.waitingList.update((patients) => patients.filter((item) => item.id !== patient.id));
    this.assignmentPatientId.set(null);
    this.assignmentFeedback.set(`Turno demostrativo asignado a ${patient.name}.`);
  }

  updateAppointment(updatedAppointment: Appointment): void {
    this.appointments.update((appointments) =>
      appointments.map((appointment) =>
        appointment.id === updatedAppointment.id
          ? updatedAppointment
          : appointment,
      ),
    );
    this.selectedAppointment.set(updatedAppointment);
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
