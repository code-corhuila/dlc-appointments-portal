import { TestBed } from '@angular/core/testing';

import { CalendarPageComponent } from './calendar-page.component';

describe('CalendarPageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarPageComponent],
    }).compileComponents();
  });

  it('renders the calendar heading and clinic time zone', () => {
    const fixture = TestBed.createComponent(CalendarPageComponent);

    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Calendario de Citas');
    expect(element.textContent).toContain('America/Bogota');
  });

  it('offers month and week views', () => {
    const fixture = TestBed.createComponent(CalendarPageComponent);

    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector('[data-calendar-view="month"]'),
    ).not.toBeNull();

    expect(
      element.querySelector('[data-calendar-view="week"]'),
    ).not.toBeNull();
  });

  it('renders the seven weekday headings', () => {
    const fixture = TestBed.createComponent(CalendarPageComponent);

    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    const headings = Array.from(
      element.querySelectorAll('[data-weekday]'),
    ).map((item) => item.textContent?.trim());

    expect(headings).toEqual([
      'Dom',
      'Lun',
      'Mar',
      'Mié',
      'Jue',
      'Vie',
      'Sáb',
    ]);
  });

  it('renders the appointment status legend', () => {
    const fixture = TestBed.createComponent(CalendarPageComponent);

    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Programada');
    expect(text).toContain('Confirmada');
    expect(text).toContain('En atención');
    expect(text).toContain('Finalizada');
    expect(text).toContain('Cancelada');
    expect(text).toContain('No asistió');
  });

  it('switches from month to week view', () => {
    const fixture = TestBed.createComponent(CalendarPageComponent);

    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    const weekButton =
      element.querySelector<HTMLButtonElement>(
        '[data-calendar-view="week"]',
      );

    weekButton?.click();
    fixture.detectChanges();

    expect(
      element.querySelectorAll('[data-calendar-day]'),
    ).toHaveLength(7);
  });

  it('renders 42 cells in month view', () => {
    const fixture = TestBed.createComponent(CalendarPageComponent);

    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(
      element.querySelectorAll('[data-calendar-day]'),
    ).toHaveLength(42);
  });
});