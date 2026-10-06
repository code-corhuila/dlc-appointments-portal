import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendarPageComponent } from './calendar-page.component';

describe('CalendarPageComponent', () => {
  let fixture: ComponentFixture<CalendarPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CalendarPageComponent);
    fixture.detectChanges();
  });

  it('renders the calendar heading and clinic timezone', () => {
    const element: HTMLElement = fixture.nativeElement;

    expect(
      element.querySelector('h1')?.textContent?.trim(),
    ).toBe('Calendario de Citas');

    expect(element.textContent).toContain('America/Bogota');
  });

  it('renders calendar navigation and month/week view controls', () => {
    const element: HTMLElement = fixture.nativeElement;

    const previousButton = element.querySelector<HTMLButtonElement>(
      '[aria-label="Periodo anterior"]',
    );

    const nextButton = element.querySelector<HTMLButtonElement>(
      '[aria-label="Periodo siguiente"]',
    );

    const monthButton = element.querySelector<HTMLButtonElement>(
      '[data-calendar-view="month"]',
    );

    const weekButton = element.querySelector<HTMLButtonElement>(
      '[data-calendar-view="week"]',
    );

    expect(previousButton).not.toBeNull();
    expect(nextButton).not.toBeNull();

    expect(monthButton?.textContent?.trim()).toBe('Mes');
    expect(weekButton?.textContent?.trim()).toBe('Semana');
  });

  it('renders the weekly headers and calendar support panels', () => {
    const element: HTMLElement = fixture.nativeElement;

    const weekdayLabels = Array.from(
      element.querySelectorAll('[data-weekday]'),
    ).map((weekday) => weekday.textContent?.trim());

    expect(weekdayLabels).toEqual([
      'Dom',
      'Lun',
      'Mar',
      'Mié',
      'Jue',
      'Vie',
      'Sáb',
    ]);

    expect(element.textContent).toContain('Estados de cita');
    expect(element.textContent).toContain('Citas del día');
  });

  it('renders the October 2026 month grid with 42 calendar days', () => {
    const element: HTMLElement = fixture.nativeElement;

    const days = Array.from(
      element.querySelectorAll<HTMLElement>(
        '[data-calendar-day]',
      ),
    );

    expect(days).toHaveLength(42);

    expect(days[0]?.dataset['date']).toBe('2026-09-27');
    expect(days[0]?.textContent?.trim()).toBe('27');

    expect(days[4]?.dataset['date']).toBe('2026-10-01');
    expect(days[4]?.textContent?.trim()).toBe('1');

    expect(days[41]?.dataset['date']).toBe('2026-11-07');
    expect(days[41]?.textContent?.trim()).toBe('7');
  });

  it('marks days outside the active month for visual differentiation', () => {
    const element: HTMLElement = fixture.nativeElement;

    const septemberDay = element.querySelector<HTMLElement>(
      '[data-calendar-day][data-date="2026-09-27"]',
    );

    const octoberDay = element.querySelector<HTMLElement>(
      '[data-calendar-day][data-date="2026-10-01"]',
    );

    const novemberDay = element.querySelector<HTMLElement>(
      '[data-calendar-day][data-date="2026-11-07"]',
    );

    expect(septemberDay?.dataset['currentMonth']).toBe('false');
    expect(octoberDay?.dataset['currentMonth']).toBe('true');
    expect(novemberDay?.dataset['currentMonth']).toBe('false');
  });

  it('switches from the month grid to the selected week', () => {
    const element: HTMLElement = fixture.nativeElement;

    const weekButton = element.querySelector<HTMLButtonElement>(
      '[data-calendar-view="week"]',
    );

    weekButton?.click();
    fixture.detectChanges();

    const days = Array.from(
      element.querySelectorAll<HTMLElement>(
        '[data-calendar-day]',
      ),
    );

    expect(days).toHaveLength(7);

    expect(days[0]?.dataset['date']).toBe('2026-10-11');
    expect(days[6]?.dataset['date']).toBe('2026-10-17');

    expect(
      element
        .querySelector('[data-calendar-view="week"]')
        ?.getAttribute('aria-pressed'),
    ).toBe('true');

    expect(
      element
        .querySelector('[data-calendar-view="month"]')
        ?.getAttribute('aria-pressed'),
    ).toBe('false');
  });
});