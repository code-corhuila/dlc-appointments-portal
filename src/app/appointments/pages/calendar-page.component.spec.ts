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
});