import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DentistOwnCalendarComponent } from './dentist-own-calendar.component';

describe('DentistOwnCalendarComponent', () => {
  let fixture: ComponentFixture<DentistOwnCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DentistOwnCalendarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DentistOwnCalendarComponent);
    fixture.detectChanges();
  });

  it('renders own demonstration appointments without state-management controls', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain('Mi calendario');
    expect(element.querySelector('[data-own-calendar-appointment]')?.textContent).toContain('PROGRAMADA');
    expect(element.querySelector('[data-appointment-confirm], [data-appointment-cancel], [data-appointment-reschedule], [data-appointment-start-attention], [data-appointment-no-show], [data-appointment-complete]')).toBeNull();
  });

  it('shows only the selected appointment detail with the minimum demo identity', () => {
    const element = fixture.nativeElement as HTMLElement;
    const appointments = element.querySelectorAll<HTMLButtonElement>('[data-own-calendar-appointment]');

    appointments[1].click();
    fixture.detectChanges();

    expect(element.querySelector('[data-own-appointment-detail]')?.textContent)
      .toContain('Paciente demostrativo 2');
    expect(element.querySelector('[data-own-appointment-detail]')?.textContent)
      .toContain('FINALIZADA');
  });

  it('renders a monthly grid, navigates it, and clears an obsolete detail', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('[data-own-calendar-day]')).toHaveLength(35);
    expect(element.querySelector('[data-appointment-id="appointment-own-demo-001"]'))
      .not.toBeNull();

    element.querySelector<HTMLButtonElement>('[data-appointment-id="appointment-own-demo-001"]')!.click();
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('[aria-label="Periodo siguiente"]')!.click();
    fixture.detectChanges();

    expect(element.querySelector('[data-own-calendar-period]')?.textContent).toContain('Noviembre');
    expect(element.querySelector('[data-own-appointment-detail]')).toBeNull();
  });

  it('keeps demonstration appointments isolated by simulated dentist', () => {
    const component = fixture.componentInstance;
    const element = fixture.nativeElement as HTMLElement;

    component.setDemoDentist('dentist-own-demo-002');
    fixture.detectChanges();

    expect(element.querySelector('[data-appointment-id="appointment-own-demo-001"]'))
      .toBeNull();
    expect(element.querySelector('[data-appointment-id="appointment-own-demo-003"]'))
      .not.toBeNull();
  });
});
