import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';

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
});
