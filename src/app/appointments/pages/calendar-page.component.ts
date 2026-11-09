import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';

import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';

import { ApiErrorAlertComponent } from '../components/api-error-alert.component';
import { AppointmentsApiService } from '../data/appointments-api.service';
import { CalendarDataSource } from '../data/calendar-data-source';
import { CLINIC_CLOCK } from '../data/clinic-clock';
import { buildCalendarDays } from '../domain/calendar-grid';
import { CalendarView } from '../domain/calendar-range';
import { clinicToday, toClinicLocalDateTime } from '../domain/clinic-time';
import { ApiError } from '../model/api-error';
import { Appointment } from '../model/appointment';
import { AppointmentActionsComponent } from './appointment-actions.component';
import { Router } from '@angular/router';
import { CompositionNavigationService } from '../../composition-navigation.service';
import { SHELL_CONTEXT } from '../../shell-contract';
import { CalendarSidePanelComponent } from '../components/calendar-side-panel.component';
import type { AppointmentType } from '../model/waiting-list';

const SCHEDULING_ROLES = new Set([
  'ADMINISTRATOR',
  'SECRETARY_ASSISTANT',
]);

const MANAGING_ROLES = new Set([
  'ADMINISTRATOR',
  'SECRETARY_ASSISTANT',
  'DENTIST',
]);

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
  imports: [AppointmentActionsComponent, ApiErrorAlertComponent, CalendarSidePanelComponent],
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

      @if (appointmentNotice()) {
        <section class="created-appointment-notice" data-created-appointment-notice role="status"><button type="button" class="created-notice-close" aria-label="Cerrar confirmación" (click)="dismissAppointmentNotice()">×</button>
          <div class="created-notice-heading"><span class="created-notice-check" aria-hidden="true">✓</span><div><h2>¡Cita agendada correctamente!</h2><p>La cita quedó registrada y ya puedes consultarla en el calendario.</p></div></div>
          <div class="created-notice-details"><span aria-hidden="true">▣</span><strong>{{ appointmentNotice() }}</strong><span aria-hidden="true">◷</span><strong>{{ appointmentTime() }}</strong>@if (appointmentService()) { <span class="created-notice-service">{{ appointmentService() }}</span> }</div>
        </section>
      }

      @if (loadError(); as error) {
        <app-api-error-alert [error]="error" />
      }

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
              data-calendar-grid
              aria-label="Días del calendario"
            >
              @for (day of days(); track day.date) {
                @let dailyAppointments = appointmentsForDate(day.date);
                <div class="calendar-day" data-calendar-day [attr.data-date]="day.date" [attr.data-current-month]="day.isCurrentMonth" (pointerenter)="openDailyPreview(day.date, $event)" (keydown.escape)="closeDailyPreview()">
                  <button type="button" (click)="selectAppointmentForDate(day.date)">{{ dayNumber(day.date) }}</button>
                  @for (appointment of dailyAppointments.slice(0, visibleLabels()); track appointment.id) {
                    <button type="button" class="calendar-appointment-label" [attr.data-calendar-appointment]="appointment.id" [style.border-left-color]="typeOf(appointment)?.color" [attr.title]="typeOf(appointment)?.label" (click)="selectAppointment(appointment)">
                      {{ appointment.startAt.slice(11, 16) }}<span class="visually-hidden">{{ appointment.status }}</span>
                    </button>
                  }
                  @if (dailyAppointments.length > visibleLabels()) { <button type="button" class="calendar-more-appointments" data-calendar-more [attr.aria-label]="'Ver ' + dailyAppointments.length + ' citas del ' + formatAppointmentDate(day.date)" (click)="openDailyPreview(day.date, $event)">+{{ dailyAppointments.length - visibleLabels() }}</button> }
                  @if (dailyAppointments.length) {
                    <button type="button" class="calendar-day-preview-trigger" [attr.data-daily-preview-trigger]="day.date" [attr.aria-expanded]="dailyPreviewDate() === day.date" [attr.aria-controls]="'daily-preview-' + day.date" [attr.aria-label]="'Ver ' + dailyAppointments.length + ' citas del ' + formatAppointmentDate(day.date)" (focus)="openDailyPreview(day.date, $event)" (click)="openDailyPreview(day.date, $event)">
                      <span aria-hidden="true">⌄</span>
                    </button>
                  }
                </div>
              }
            </div>
          </section>

          @if (dailyPreviewDate(); as previewDate) {
            <section class="daily-appointment-preview" [attr.id]="'daily-preview-' + previewDate" [attr.data-daily-appointment-preview]="previewDate" role="region" [attr.aria-label]="'Citas del ' + formatAppointmentDate(previewDate)" tabindex="-1" [style.top.px]="dailyPreviewPosition().top" [style.left.px]="dailyPreviewPosition().left" (keydown.escape)="closeDailyPreview()">
              <header><div><strong>{{ formatAppointmentDate(previewDate) }}</strong><span>{{ dailyPreviewAppointments().length }} {{ dailyPreviewAppointments().length === 1 ? 'cita' : 'citas' }}</span></div><button type="button" aria-label="Cerrar vista previa de citas" (click)="closeDailyPreview()">×</button></header>
              <div class="daily-appointment-list" role="list">
                @for (appointment of dailyPreviewAppointments(); track appointment.id) {
                  <button type="button" [attr.data-daily-preview-appointment]="appointment.id" (click)="selectPreviewAppointment(appointment)">
                    <time>{{ formatAppointmentTime(appointment.startAt) }} – {{ formatAppointmentTime(appointment.endAt) }}</time>
                    <span>{{ appointment.reason ?? 'Cita' }}</span><em>{{ appointment.status }}</em>
                  </button>
                }
              </div>
            </section>
          }

          @if (canScheduleAppointment()) {
            <div class="calendar-scheduling-action">
              <button
                type="button"
                class="schedule-appointment-button calendar-primary-action"
                data-schedule-appointment
                (click)="scheduleAppointment()"
              >
                + Agendar nueva cita
              </button>
            </div>
          }

          @if (selectedAppointment(); as appointment) {
            <section
              class="calendar-panel selected-appointment-panel"
              data-selected-appointment
            >
              <h2>Cita seleccionada</h2>
              <dl>
                <div><dt>Referencia</dt><dd>{{ appointment.id }}</dd></div>
                <div><dt>Estado</dt><dd><span class="appointment-status">{{ appointment.status }}</span></dd></div>
                <div><dt>Fecha</dt><dd>{{ formatAppointmentDate(appointment.startAt) }}</dd></div>
                <div><dt>Horario</dt><dd>{{ formatAppointmentTime(appointment.startAt) }} – {{ formatAppointmentTime(appointment.endAt) }}</dd></div>
              </dl>

              <app-appointment-actions
                [appointment]="appointment"
                [canManage]="canManageAppointments()"
                [now]="now()"
                (appointmentUpdated)="updateAppointment($event)"
              />
            </section>
          }
        </div>

        <app-calendar-side-panel />
      </section>
    </main>
  `,
})
export class CalendarPageComponent {
  private readonly api = inject(AppointmentsApiService);
  private readonly clock = inject(CLINIC_CLOCK);
  private readonly router = inject(Router, { optional: true });
  private readonly compositionNavigation = inject(
    CompositionNavigationService,
    { optional: true },
  );
  private readonly shellContext = inject(SHELL_CONTEXT, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private noticeTimeout?: ReturnType<typeof setTimeout>;

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

  /** Appointments of the visible period, read from the Appointments API and shown at clinic time. */
  readonly appointments = signal<readonly Appointment[]>([]);
  readonly loadError = signal<ApiError | null>(null);
  private readonly reload = signal(0);

  readonly selectedAppointment = signal<Appointment | null>(null);
  /** The month grid keeps two labels per day and summarizes the rest as "+N"; the week view lists every one. */
  readonly visibleLabels = computed(() => (this.view() === 'week' ? Number.POSITIVE_INFINITY : 2));
  /** HU-APT-006: catalog types by code, to colour each appointment label. */
  private readonly types = signal<ReadonlyMap<string, AppointmentType>>(new Map());
  readonly dailyPreviewDate = signal<string | null>(null);
  readonly dailyPreviewPosition = signal({ top: 16, left: 16 });
  readonly appointmentNotice = signal<string | null>(null);
  readonly appointmentTime = signal<string | null>(null);
  readonly appointmentService = signal<string | null>(null);
  readonly now = computed(() => {
    this.reload();
    return this.clock();
  });

  private readonly anchorDate = signal(clinicToday(this.clock()));

  readonly view = signal<CalendarView>('month');

  readonly days = computed(() =>
    buildCalendarDays(this.anchorDate(), this.view()),
  );

  readonly periodLabel = computed(() =>
    this.view() === 'month'
      ? this.monthLabel()
      : this.weekLabel(),
  );

  readonly canScheduleAppointment = computed(() =>
    this.shellContext?.session.getSnapshot().user?.roles.some((role) =>
      SCHEDULING_ROLES.has(role),
    ) ?? false,
  );

  /** The owner still enforces each lifecycle action; the role only decides which controls are offered. */
  readonly canManageAppointments = computed(() =>
    this.shellContext?.session.getSnapshot().user?.roles.some((role) =>
      MANAGING_ROLES.has(role),
    ) ?? false,
  );

  readonly dailyPreviewAppointments = computed(() => {
    const date = this.dailyPreviewDate();
    return date ? this.appointmentsForDate(date) : [];
  });

  constructor() {
    this.api.listAppointmentTypes().pipe(takeUntilDestroyed()).subscribe({
      next: (catalog) => this.types.set(new Map(catalog.data.map((type) => [type.code, type]))),
      error: () => this.types.set(new Map()),
    });
    const source = new CalendarDataSource(this.api);
    source.errors$
      .pipe(takeUntilDestroyed())
      .subscribe((error) => {
        this.appointments.set([]);
        this.loadError.set(error);
      });
    source
      .connect(
        toObservable(
          computed(() => {
            this.reload();
            return { anchorDate: this.anchorDate(), view: this.view() };
          }),
        ),
      )
      .pipe(takeUntilDestroyed())
      .subscribe((page) => {
        this.loadError.set(null);
        this.appointments.set(page.data.map(toClinicTime));
        this.refreshSelection();
      });

    const state = this.router?.getCurrentNavigation()?.extras.state as { appointmentId?: string; appointmentDate?: string } | undefined;
    if (!state?.appointmentId || !state.appointmentDate) return;
    this.anchorDate.set(state.appointmentDate);
    const appointment = this.appointments().find((item) => item.id === state.appointmentId) ?? null;
    this.selectedAppointment.set(appointment);
    this.appointmentNotice.set(appointment ? this.formatAppointmentDate(appointment.startAt) : null);
    this.appointmentTime.set(appointment ? this.formatAppointmentTime(appointment.startAt) : null);
    this.appointmentService.set(appointment?.reason ?? null);
    window.history.replaceState({}, document.title);
    this.noticeTimeout = setTimeout(() => this.dismissAppointmentNotice(), 5000);
    this.destroyRef.onDestroy(() => this.dismissAppointmentNotice());
  }

  dismissAppointmentNotice(): void { if (this.noticeTimeout) clearTimeout(this.noticeTimeout); this.noticeTimeout = undefined; this.appointmentNotice.set(null); this.appointmentTime.set(null); this.appointmentService.set(null); }

  selectView(view: CalendarView): void {
    this.closeDailyPreview();
    this.view.set(view);
  }

  previousPeriod(): void {
    this.closeDailyPreview();
    this.navigatePeriod(-1);
  }

  nextPeriod(): void {
    this.closeDailyPreview();
    this.navigatePeriod(1);
  }

  scheduleAppointment(): void {
    if (this.compositionNavigation) {
      void this.compositionNavigation.request({ localPath: '/new' });
      return;
    }
    void this.router?.navigate(['/new']);
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
    return this.appointments()
      .filter((appointment) => appointment.startAt.startsWith(date))
      .sort((first, second) => first.startAt.localeCompare(second.startAt));
  }

  typeOf(appointment: Appointment): AppointmentType | undefined {
    return appointment.typeCode ? this.types().get(appointment.typeCode) : undefined;
  }

  openDailyPreview(date: string, event?: Event): void {
    if (!this.appointmentsForDate(date).length) return;
    if (this.dailyPreviewDate() && this.dailyPreviewDate() !== date && event?.type !== 'click') return;
    if (event instanceof MouseEvent) event.stopPropagation();
    this.dailyPreviewDate.set(date);
    const day = (event?.currentTarget as HTMLElement | null)?.closest<HTMLElement>('[data-calendar-day]');
    if (!day) return;
    const rect = day.getBoundingClientRect();
    const width = 344;
    const height = 420;
    const left = rect.right + width + 16 > window.innerWidth ? rect.left - width - 16 : rect.right + 16;
    const top = rect.bottom + height + 16 > window.innerHeight ? rect.bottom - height : rect.top;
    this.dailyPreviewPosition.set({
      left: Math.max(16, Math.min(left, window.innerWidth - width - 16)),
      top: Math.max(16, Math.min(top, window.innerHeight - height - 16)),
    });
  }

  closeDailyPreview(): void {
    this.dailyPreviewDate.set(null);
  }

  selectPreviewAppointment(appointment: Appointment): void {
    this.selectAppointment(appointment);
  }

  @HostListener('document:click', ['$event'])
  closeDailyPreviewOnOutsideClick(event: MouseEvent): void {
    if (!(event.target instanceof HTMLElement) || !event.target.closest('[data-daily-appointment-preview]')) {
      this.closeDailyPreview();
    }
  }

  selectAppointmentForDate(date: string): void {
    this.selectedAppointment.set(this.appointmentForDate(date) ?? null);
  }

  selectAppointment(appointment: Appointment): void {
    this.selectedAppointment.set(appointment);
  }

  /** After a lifecycle action the period is read again, so the calendar shows the owner state. */
  updateAppointment(updatedAppointment: Appointment): void {
    this.selectedAppointment.set(toClinicTime(updatedAppointment));
    this.reload.update((value) => value + 1);
  }

  private refreshSelection(): void {
    const selected = this.selectedAppointment();
    if (!selected) return;
    this.selectedAppointment.set(
      this.appointments().find((item) => item.id === selected.id) ?? null,
    );
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

function toClinicTime(appointment: Appointment): Appointment {
  return {
    ...appointment,
    startAt: toClinicLocalDateTime(appointment.startAt),
    endAt: toClinicLocalDateTime(appointment.endAt),
  };
}
