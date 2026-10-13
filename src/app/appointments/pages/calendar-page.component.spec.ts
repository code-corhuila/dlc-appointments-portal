import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';

import { CompositionNavigationService } from '../../composition-navigation.service';
import { SHELL_CONTEXT } from '../../shell-contract';
import {
  CALENDAR_SUPPORT_DATA_SOURCE,
  CALENDAR_SUPPORT_FIXTURE_DATA,
} from '../data/calendar-support-data-source';
import { CalendarAppointmentDemoService } from '../data/calendar-appointment-demo.service';
import { AppointmentsApiService } from '../data/appointments-api.service';
import { CalendarPageComponent } from './calendar-page.component';

describe('CalendarPageComponent', () => {
  let fixture: ComponentFixture<CalendarPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarPageComponent],
      providers: [
        {
          provide: CALENDAR_SUPPORT_DATA_SOURCE,
          useValue: CALENDAR_SUPPORT_FIXTURE_DATA,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(
      CalendarPageComponent,
    );
    fixture.detectChanges();
  });

  it('renders the calendar heading and clinic timezone', () => {
    const element =
      fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain(
      'Calendario de Citas',
    );

    expect(element.textContent).toContain(
      'America/Bogota',
    );
  });

  it.each(['ADMINISTRATOR', 'SECRETARY_ASSISTANT'])(
    'renders the scheduling action for %s',
    async (role) => {
      const composed = await createCalendarForRoles([role]);

      expect(
        composed.nativeElement.querySelector('[data-schedule-appointment]')?.textContent?.trim(),
      ).toBe('+ Agendar nueva cita');
    },
  );

  it('renders the scheduling action as a primary styled button', async () => {
    const composed = await createCalendarForRoles(['ADMINISTRATOR']);

    expect(
      composed.nativeElement.querySelector(
        'button[data-schedule-appointment].calendar-primary-action',
      ),
    ).not.toBeNull();
  });

  it('does not render the scheduling action for an unsupported role', async () => {
    const composed = await createCalendarForRoles(['DENTIST']);

    expect(composed.nativeElement.querySelector('[data-schedule-appointment]')).toBeNull();
  });

  it('uses shell navigation to request the composed scheduling route', async () => {
    const request = vi.fn();
    const composed = await createCalendarForRoles(['ADMINISTRATOR'], request);

    (composed.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-schedule-appointment]')?.click();

    expect(request).toHaveBeenCalledWith({ path: '/app/appointments/new' });
  });

  it('retains Angular Router navigation as the standalone fallback', async () => {
    const navigate = vi.fn();
    const composed = await createCalendarForRoles(['ADMINISTRATOR'], undefined, navigate);

    (composed.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-schedule-appointment]')?.click();

    expect(navigate).toHaveBeenCalledWith(['/new']);
  });

  async function createCalendarForRoles(
    roles: readonly string[],
    request?: ReturnType<typeof vi.fn>,
    navigate?: ReturnType<typeof vi.fn>,
  ): Promise<ComponentFixture<CalendarPageComponent>> {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CalendarPageComponent],
      providers: [
        { provide: CALENDAR_SUPPORT_DATA_SOURCE, useValue: CALENDAR_SUPPORT_FIXTURE_DATA },
        {
          provide: SHELL_CONTEXT,
          useValue: {
            session: { getSnapshot: () => ({ user: { id: 'demo-user', roles } }) },
            navigation: { request: request ?? vi.fn() },
          },
        },
        ...(request ? [CompositionNavigationService] : []),
        ...(navigate ? [{
          provide: Router,
          useValue: { navigate, getCurrentNavigation: () => null },
        }] : []),
      ],
    }).compileComponents();
    const composed = TestBed.createComponent(CalendarPageComponent);
    composed.detectChanges();
    return composed;
  }

  function addSixAppointmentsToOctoberSixteenth(): void {
    const component = fixture.componentInstance as unknown as {
      fixtureAppointments: { set: (appointments: readonly unknown[]) => void };
    };
    const appointments = fixture.componentInstance.appointments();
    const schedulable = appointments.find((appointment) => appointment.id === 'appointment-demo-001')!;

    component.fixtureAppointments.set([
      ...appointments,
      ...['001', '002', '003', '004'].map((suffix, index) => ({
        ...schedulable,
        id: `preview-extra-${suffix}`,
        startAt: `2026-10-16T${String(index + 15).padStart(2, '0')}:00:00-05:00`,
        endAt: `2026-10-16T${String(index + 15).padStart(2, '0')}:30:00-05:00`,
      })),
    ]);
    fixture.detectChanges();
  }

  function openOctoberSixteenthPreview(element: HTMLElement): void {
    element.querySelector<HTMLElement>('[data-calendar-day][data-date="2026-10-16"]')
      ?.dispatchEvent(new Event('pointerenter'));
    fixture.detectChanges();
  }

  it('renders calendar navigation and month/week view controls', () => {
    const element =
      fixture.nativeElement as HTMLElement;

    const previousButton =
      element.querySelector<HTMLButtonElement>(
        '[aria-label="Periodo anterior"]',
      );

    const nextButton =
      element.querySelector<HTMLButtonElement>(
        '[aria-label="Periodo siguiente"]',
      );

    const monthButton =
      element.querySelector<HTMLButtonElement>(
        '[data-calendar-view="month"]',
      );

    const weekButton =
      element.querySelector<HTMLButtonElement>(
        '[data-calendar-view="week"]',
      );

    expect(previousButton).not.toBeNull();
    expect(nextButton).not.toBeNull();
    expect(monthButton?.textContent?.trim()).toBe('Mes');
    expect(weekButton?.textContent?.trim()).toBe('Semana');
    expect(monthButton?.getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(weekButton?.getAttribute('aria-pressed')).toBe(
      'false',
    );
  });

  it('renders the weekly headers and calendar support panels', () => {
    const element =
      fixture.nativeElement as HTMLElement;

    const weekdays = Array.from(
      element.querySelectorAll<HTMLElement>(
        '[data-weekday]',
      ),
    ).map((weekday) => weekday.textContent?.trim());

    expect(weekdays).toEqual([
      'Dom',
      'Lun',
      'Mar',
      'Mié',
      'Jue',
      'Vie',
      'Sáb',
    ]);

    expect(element.textContent).toContain(
      'Tratamientos',
    );

    expect(element.textContent).toContain(
      'Lista de Espera',
    );
  });

  it('renders only the complete weeks required by October 2026', () => {
    const element =
      fixture.nativeElement as HTMLElement;

    const days = element.querySelectorAll(
      '[data-calendar-day]',
    );

    expect(days).toHaveLength(35);

    expect(
      (
        days[0] as HTMLElement
      ).dataset['date'],
    ).toBe('2026-09-27');

    expect(
      (
        days[34] as HTMLElement
      ).dataset['date'],
    ).toBe('2026-10-31');
  });

  it('marks days outside the active month for visual differentiation', () => {
    const element =
      fixture.nativeElement as HTMLElement;

    const septemberDay =
      element.querySelector<HTMLElement>(
        '[data-date="2026-09-27"]',
      );

    const octoberDay =
      element.querySelector<HTMLElement>(
        '[data-date="2026-10-01"]',
      );

    expect(
      septemberDay?.dataset['currentMonth'],
    ).toBe('false');

    expect(
      octoberDay?.dataset['currentMonth'],
    ).toBe('true');

    const nextButton =
      element.querySelector<HTMLButtonElement>(
        '[aria-label="Periodo siguiente"]',
      );

    nextButton?.click();
    fixture.detectChanges();

    const decemberDay =
      element.querySelector<HTMLElement>(
        '[data-date="2026-12-01"]',
      );

    expect(
      decemberDay?.dataset['currentMonth'],
    ).toBe('false');
  });

  it('opens an ordered daily preview on hover without selecting an appointment', () => {
    const element = fixture.nativeElement as HTMLElement;
    const day = element.querySelector<HTMLElement>(
      '[data-calendar-day][data-date="2026-10-16"]',
    );

    day?.dispatchEvent(new Event('pointerenter'));
    fixture.detectChanges();

    const preview = element.querySelector<HTMLElement>(
      '[data-daily-appointment-preview="2026-10-16"]',
    );
    const appointments = Array.from(
      preview?.querySelectorAll<HTMLElement>('[data-daily-preview-appointment]') ?? [],
    ).map((item) => item.textContent?.trim());

    expect(preview?.textContent).toContain('16 de octubre de 2026');
    expect(preview?.textContent).toContain('2 citas');
    expect(appointments).toHaveLength(2);
    expect(appointments[0]).toContain('1:00 p. m.');
    expect(appointments[1]).toContain('2:00 p. m.');
    expect(element.querySelector('[data-selected-appointment]')).toBeNull();
    expect(day?.textContent).not.toContain('Ver 2 citas');
    expect(element.querySelector('[data-calendar-grid]')?.contains(preview)).toBe(false);
  });

  it('keeps compact full-time indicators and calculates the overflow badge', () => {
    const component = fixture.componentInstance as unknown as {
      fixtureAppointments: { set: (appointments: readonly unknown[]) => void };
    };
    const appointments = fixture.componentInstance.appointments();
    const octoberSixteenth = appointments.find((appointment) => appointment.id === 'appointment-demo-015')!;

    component.fixtureAppointments.set([
      ...appointments,
      { ...octoberSixteenth, id: 'preview-extra-001', startAt: '2026-10-16T15:00:00-05:00', endAt: '2026-10-16T15:30:00-05:00' },
      { ...octoberSixteenth, id: 'preview-extra-002', startAt: '2026-10-16T16:00:00-05:00', endAt: '2026-10-16T16:30:00-05:00' },
    ]);
    fixture.detectChanges();

    const day = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
      '[data-calendar-day][data-date="2026-10-16"]',
    );

    expect(day?.querySelector('[data-calendar-appointment="appointment-demo-015"]')?.textContent).toContain('13:00');
    expect(day?.querySelector('[data-calendar-more]')?.textContent?.trim()).toBe('+2');
  });

  it('keeps the floating preview open after pointer movement and closes on outside click', () => {
    const element = fixture.nativeElement as HTMLElement;
    const day = element.querySelector<HTMLElement>(
      '[data-calendar-day][data-date="2026-10-16"]',
    )!;

    day.dispatchEvent(new Event('pointerenter'));
    fixture.detectChanges();
    day.dispatchEvent(new MouseEvent('pointerleave', { relatedTarget: document.body }));
    fixture.detectChanges();

    expect(element.querySelector('[data-daily-appointment-preview="2026-10-16"]')).not.toBeNull();

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(element.querySelector('[data-daily-appointment-preview]')).toBeNull();
  });

  it('shows six appointments with two compact chips and a +4 overflow indicator', () => {
    const element = fixture.nativeElement as HTMLElement;
    addSixAppointmentsToOctoberSixteenth();

    const day = element.querySelector<HTMLElement>('[data-calendar-day][data-date="2026-10-16"]')!;

    expect(day.querySelectorAll('[data-calendar-appointment]')).toHaveLength(2);
    expect(day.querySelector('[data-calendar-more]')?.textContent?.trim()).toBe('+4');
  });

  it.each([
    'appointment-demo-015',
    'preview-extra-001',
    'preview-extra-003',
    'preview-extra-004',
  ])('selects preview appointment %s regardless of its position', (appointmentId) => {
    const element = fixture.nativeElement as HTMLElement;
    addSixAppointmentsToOctoberSixteenth();
    openOctoberSixteenthPreview(element);

    element.querySelector<HTMLButtonElement>(`[data-daily-preview-appointment="${appointmentId}"]`)?.click();
    fixture.detectChanges();

    expect(element.querySelector('[data-selected-appointment]')?.textContent).toContain(appointmentId);
  });

  it('keeps the final preview appointment selectable after scrolling and keyboard focus', () => {
    const element = fixture.nativeElement as HTMLElement;
    addSixAppointmentsToOctoberSixteenth();
    openOctoberSixteenthPreview(element);

    const list = element.querySelector<HTMLElement>('.daily-appointment-list')!;
    const finalAppointment = element.querySelector<HTMLButtonElement>('[data-daily-preview-appointment="preview-extra-004"]')!;
    list.scrollTop = list.scrollHeight;
    finalAppointment.focus();
    finalAppointment.click();
    fixture.detectChanges();

    expect(element.querySelector('[data-selected-appointment]')?.textContent).toContain('preview-extra-004');
    expect(element.querySelector('[data-appointment-confirm]')).not.toBeNull();
  });

  it('selects a preview appointment using the existing details panel', () => {
    const element = fixture.nativeElement as HTMLElement;
    const day = element.querySelector<HTMLElement>(
      '[data-calendar-day][data-date="2026-10-16"]',
    );
    day?.dispatchEvent(new Event('pointerenter'));
    fixture.detectChanges();

    element
      .querySelector<HTMLButtonElement>('[data-daily-preview-appointment="appointment-demo-completion-001"]')
      ?.click();
    fixture.detectChanges();

    const details = element.querySelector<HTMLElement>('[data-selected-appointment]');

    expect(details?.textContent).toContain('appointment-demo-completion-001');
    expect(details?.querySelector('[data-appointment-complete]')).not.toBeNull();
    expect(element.querySelector('[data-daily-appointment-preview]')).not.toBeNull();

    element.querySelector<HTMLButtonElement>('[data-daily-preview-appointment="appointment-demo-015"]')?.click();
    fixture.detectChanges();

    expect(details?.textContent).toContain('appointment-demo-015');
  });

  it('closes the preview with Escape without changing appointment state', () => {
    const element = fixture.nativeElement as HTMLElement;
    const day = element.querySelector<HTMLElement>(
      '[data-calendar-day][data-date="2026-10-16"]',
    );
    day?.dispatchEvent(new Event('pointerenter'));
    fixture.detectChanges();

    element
      .querySelector<HTMLElement>('[data-daily-appointment-preview="2026-10-16"]')
      ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(element.querySelector('[data-daily-appointment-preview]')).toBeNull();
    expect(element.querySelector('[data-selected-appointment]')).toBeNull();
  });

  it('offers an explicit keyboard and touch control for the daily preview', () => {
    const element = fixture.nativeElement as HTMLElement;
    const trigger = element.querySelector<HTMLButtonElement>(
      '[data-daily-preview-trigger="2026-10-16"]',
    );

    trigger?.click();
    fixture.detectChanges();

    expect(trigger?.getAttribute('aria-expanded')).toBe('true');
    expect(element.querySelector('[data-daily-appointment-preview="2026-10-16"]')).not.toBeNull();

    trigger?.click();
    trigger?.dispatchEvent(new Event('focus'));
    fixture.detectChanges();

    expect(trigger?.getAttribute('aria-expanded')).toBe('true');
  });

  it('switches from the month grid to the selected week', () => {
    const element =
      fixture.nativeElement as HTMLElement;

    const weekButton =
      element.querySelector<HTMLButtonElement>(
        '[data-calendar-view="week"]',
      );

    weekButton?.click();
    fixture.detectChanges();

    const days = element.querySelectorAll(
      '[data-calendar-day]',
    );

    expect(days).toHaveLength(7);

    expect(
      (
        days[0] as HTMLElement
      ).dataset['date'],
    ).toBe('2026-10-11');

    expect(
      (
        days[6] as HTMLElement
      ).dataset['date'],
    ).toBe('2026-10-17');

    expect(
      weekButton?.getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('shows the active month and navigates between month periods', () => {
    const element =
      fixture.nativeElement as HTMLElement;

    const period =
      element.querySelector<HTMLElement>(
        '[data-calendar-period]',
      );

    const previousButton =
      element.querySelector<HTMLButtonElement>(
        '[aria-label="Periodo anterior"]',
      );

    const nextButton =
      element.querySelector<HTMLButtonElement>(
        '[aria-label="Periodo siguiente"]',
      );

    expect(period?.textContent?.trim()).toBe(
      'Octubre 2026',
    );

    nextButton?.click();
    fixture.detectChanges();

    expect(period?.textContent?.trim()).toBe(
      'Noviembre 2026',
    );

    previousButton?.click();
    fixture.detectChanges();

    expect(period?.textContent?.trim()).toBe(
      'Octubre 2026',
    );
  });

  it('navigates by seven days when the week view is active', () => {
    const element =
      fixture.nativeElement as HTMLElement;

    const weekButton =
      element.querySelector<HTMLButtonElement>(
        '[data-calendar-view="week"]',
      );

    const nextButton =
      element.querySelector<HTMLButtonElement>(
        '[aria-label="Periodo siguiente"]',
      );

    const period =
      element.querySelector<HTMLElement>(
        '[data-calendar-period]',
      );

    weekButton?.click();
    fixture.detectChanges();

    expect(period?.textContent?.trim()).toBe(
      '11 – 17 de octubre de 2026',
    );

    nextButton?.click();
    fixture.detectChanges();

    expect(period?.textContent?.trim()).toBe(
      '18 – 24 de octubre de 2026',
    );

    const days = element.querySelectorAll(
      '[data-calendar-day]',
    );

    expect(
      (
        days[0] as HTMLElement
      ).dataset['date'],
    ).toBe('2026-10-18');

    expect(
      (
        days[6] as HTMLElement
      ).dataset['date'],
    ).toBe('2026-10-24');
  });

  it('selects a demonstration appointment and confirms it without a backend request', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(
      fixture.debugElement.injector.get(AppointmentsApiService),
    ).toBeInstanceOf(CalendarAppointmentDemoService);

    const appointment = element.querySelector<HTMLButtonElement>(
      '[data-calendar-appointment="appointment-demo-001"]',
    );

    expect(appointment).not.toBeNull();

    appointment!.click();
    fixture.detectChanges();

    expect(element.querySelector('[data-selected-appointment]')?.textContent)
      .toContain('appointment-demo-001');

    const confirm = element.querySelector<HTMLButtonElement>(
      '[data-appointment-confirm]',
    );

    expect(confirm).not.toBeNull();

    confirm!.click();
    fixture.detectChanges();

    element.querySelector<HTMLButtonElement>(
      '[data-appointment-submit-confirmation]',
    )!.click();
    fixture.detectChanges();

    expect(element.querySelector('[role="status"]')?.textContent)
      .toContain('Confirmación registrada correctamente');
  });

  it('starts attention after a demonstrated confirmation', () => {
    const element = fixture.nativeElement as HTMLElement;
    element.querySelector<HTMLButtonElement>('[data-calendar-appointment="appointment-demo-001"]')!.click();
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('[data-appointment-confirm]')!.click();
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('[data-appointment-submit-confirmation]')!.click();
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('[data-appointment-start-attention]')!.click();
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('[data-appointment-submit-attention]')!.click();
    fixture.detectChanges();
    expect(element.querySelector('[data-selected-appointment]')?.textContent).toContain('EN_ATENCION');
  });

  it('completes an attention appointment and synchronizes Calendar', () => {
    const element = fixture.nativeElement as HTMLElement;
    const id = 'appointment-demo-completion-001';

    element.querySelector<HTMLButtonElement>(`[data-calendar-appointment="${id}"]`)!.click();
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('[data-appointment-complete]')!.click();
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('[data-appointment-submit-completion]')!.click();
    fixture.detectChanges();

    expect(element.querySelector('[data-selected-appointment]')?.textContent).toContain('FINALIZADA');
    expect(element.querySelector(`[data-calendar-appointment="${id}"]`)?.textContent).toContain('FINALIZADA');
    expect(element.querySelector('[data-appointment-complete]')).toBeNull();
    expect(fixture.componentInstance.appointments().filter((appointment) => appointment.id === id)).toHaveLength(1);
    expect(fixture.componentInstance.selectedAppointment()).toMatchObject({
      id, startAt: '2026-10-16T14:00:00-05:00', endAt: '2026-10-16T14:30:00-05:00',
    });
  });

  it('preserves the appointment when the completion demo is rejected', () => {
    const element = fixture.nativeElement as HTMLElement;
    const id = 'appointment-demo-completion-rejected-001';

    element.querySelector<HTMLButtonElement>(`[data-calendar-appointment="${id}"]`)!.click();
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('[data-appointment-complete]')!.click();
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('[data-appointment-submit-completion]')!.click();
    fixture.detectChanges();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain('No se pudo finalizar la atención');
    expect(element.querySelector('[data-selected-appointment]')?.textContent).toContain('EN_ATENCION');
    expect(element.querySelector(`[data-calendar-appointment="${id}"]`)?.textContent).toContain('EN_ATENCION');
  });

  it('registers a no-show for a completed demonstration appointment', () => {
    const element = fixture.nativeElement as HTMLElement;
    element.querySelector<HTMLButtonElement>('[data-calendar-appointment="appointment-demo-no-show-001"]')!.click();
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('[data-appointment-no-show]')!.click();
    fixture.detectChanges();
    const reason = element.querySelector<HTMLInputElement>('[data-no-show-reason]')!;
    reason.value = 'Paciente ausente';
    reason.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('[data-appointment-submit-no-show]')!.click();
    fixture.detectChanges();
    expect(element.querySelector('[data-selected-appointment]')?.textContent).toContain('NO_ASISTIO');
    expect(element.querySelector('[data-calendar-appointment="appointment-demo-no-show-001"]')?.textContent).toContain('NO_ASISTIO');
  });

  it('cancels an eligible demonstration appointment without a backend request', () => {
    const element = fixture.nativeElement as HTMLElement;

    element.querySelector<HTMLButtonElement>(
      '[data-calendar-appointment="appointment-demo-001"]',
    )!.click();
    fixture.detectChanges();

    const cancel = element.querySelector<HTMLButtonElement>(
      '[data-appointment-cancel]',
    );

    expect(cancel).not.toBeNull();

    cancel!.click();
    fixture.detectChanges();

    const reason = element.querySelector<HTMLInputElement>(
      '[data-cancellation-reason]',
    );

    reason!.value = 'Solicitud del paciente';
    reason!.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    element.querySelector<HTMLButtonElement>(
      '[data-appointment-submit-cancellation]',
    )!.click();
    fixture.detectChanges();

    expect(element.querySelector('[data-selected-appointment]')?.textContent)
      .toContain('CANCELADA');
    expect(element.querySelector(
      '[data-calendar-appointment="appointment-demo-001"]',
    )?.textContent).toContain('CANCELADA');
    expect(element.querySelector('[data-appointment-cancel]')).toBeNull();
  });

  it('reschedules a demonstration appointment without a backend request', () => {
    const element = fixture.nativeElement as HTMLElement;
    element.querySelector<HTMLButtonElement>(
      '[data-calendar-appointment="appointment-demo-001"]',
    )!.click();
    fixture.detectChanges();

    element.querySelector<HTMLButtonElement>(
      '[data-appointment-reschedule]',
    )!.click();
    fixture.detectChanges();

    const start = element.querySelector<HTMLInputElement>(
      '[data-rescheduling-start]',
    )!;
    const reason = element.querySelector<HTMLInputElement>(
      '[data-rescheduling-reason]',
    )!;
    start.value = '2026-10-17T09:00';
    reason.value = 'Solicitud del paciente';
    start.dispatchEvent(new Event('input', { bubbles: true }));
    reason.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    element.querySelector<HTMLButtonElement>(
      '[data-appointment-submit-rescheduling]',
    )!.click();
    fixture.detectChanges();

    expect(element.querySelector('[role="status"]')?.textContent)
      .toContain('Reprogramación registrada correctamente');
    expect(element.querySelector('[data-selected-appointment]')?.textContent)
      .toContain('17 de octubre de 2026');
  });

  it('renders the expanded fixture agenda and a dynamic waiting list', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(fixture.componentInstance.appointments()).toHaveLength(24);
    expect(element.querySelector('[data-waiting-count]')?.textContent?.trim()).toBe('8');
    expect(element.querySelectorAll('[data-waiting-patient]')).toHaveLength(8);
    expect(element.querySelectorAll('[data-calendar-appointment="appointment-demo-010"]')).toHaveLength(1);
  });

  it('assigns a waiting patient in the demonstration and updates the agenda', () => {
    const element = fixture.nativeElement as HTMLElement;

    element.querySelector<HTMLButtonElement>('[data-assign-waiting="waiting-demo-001"]')!.click();
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('[data-confirm-demo-assignment]')!.click();
    fixture.detectChanges();

    expect(element.querySelector('[data-waiting-count]')?.textContent?.trim()).toBe('7');
    expect(element.querySelector('[data-waiting-patient="waiting-demo-001"]')).toBeNull();
    expect(element.querySelector('[data-calendar-appointment="appointment-demo-waiting-demo-001"]')).not.toBeNull();
  });

  it('formats the selected appointment details for visual reading', () => {
    const element = fixture.nativeElement as HTMLElement;
    element.querySelector<HTMLButtonElement>('[data-calendar-appointment="appointment-demo-001"]')!.click();
    fixture.detectChanges();

    expect(element.querySelector('[data-selected-appointment]')?.textContent).toContain('15 de octubre de 2026');
    expect(element.querySelector('[data-selected-appointment]')?.textContent).toContain('2:00 p. m.');
    expect(element.querySelector('[data-appointment-confirm]')?.classList.contains('action-primary')).toBe(true);
  });
});
