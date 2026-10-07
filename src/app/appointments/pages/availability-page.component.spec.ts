import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvailabilityPageComponent } from './availability-page.component';

describe('AvailabilityPageComponent', () => {
  let fixture: ComponentFixture<AvailabilityPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvailabilityPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AvailabilityPageComponent);
    fixture.detectChanges();
  });

  it('renders the availability view', () => {
    expect(
      fixture.nativeElement.textContent,
    ).toContain('Horarios y Slots de Disponibilidad');
  });

  it('provides a dentist selector', () => {
    const selector = fixture.nativeElement.querySelector(
      '[data-dentist-select]',
    );

    expect(selector).not.toBeNull();
  });

  it('provides the weekly schedule', () => {
    const schedule = fixture.nativeElement.querySelector(
      '[data-weekly-schedule]',
    );

    expect(schedule).not.toBeNull();
  });

  it('uses the expected monday work shifts', () => {
    const monday = fixture.nativeElement.querySelector(
      '[data-day="monday"]',
    ) as HTMLElement;

    const shiftOneStart = monday.querySelector(
      '[data-shift-one-start]',
    ) as HTMLInputElement;

    const shiftOneEnd = monday.querySelector(
      '[data-shift-one-end]',
    ) as HTMLInputElement;

    const shiftTwoStart = monday.querySelector(
      '[data-shift-two-start]',
    ) as HTMLInputElement;

    const shiftTwoEnd = monday.querySelector(
      '[data-shift-two-end]',
    ) as HTMLInputElement;

    expect(shiftOneStart.value).toBe('08:00');
    expect(shiftOneEnd.value).toBe('12:00');
    expect(shiftTwoStart.value).toBe('14:00');
    expect(shiftTwoEnd.value).toBe('18:00');
  });

  it('uses a 30 minute default slot duration', () => {
    const monday = fixture.nativeElement.querySelector(
      '[data-day="monday"]',
    ) as HTMLElement;

    const duration = monday.querySelector(
      '[data-slot-duration]',
    ) as HTMLSelectElement;

    expect(duration.value).toBe('30');
  });

  it('disables monday schedule fields when monday is disabled', () => {
    const monday = fixture.nativeElement.querySelector(
      '[data-day="monday"]',
    ) as HTMLElement;

    const enabled = monday.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement;

    const shiftInputs = Array.from(
      monday.querySelectorAll('input[type="time"], select'),
    ) as Array<HTMLInputElement | HTMLSelectElement>;

    expect(enabled.checked).toBe(true);
    expect(shiftInputs.every((control) => !control.disabled)).toBe(true);

    enabled.click();
    fixture.detectChanges();

    expect(enabled.checked).toBe(false);
    expect(shiftInputs.every((control) => control.disabled)).toBe(true);
  });

  it('provides the slot generation controls', () => {
    expect(
      fixture.nativeElement.querySelector('[data-start-date]'),
    ).not.toBeNull();

    expect(
      fixture.nativeElement.querySelector('[data-end-date]'),
    ).not.toBeNull();

    expect(
      fixture.nativeElement.querySelector('[data-generate-slots]'),
    ).not.toBeNull();
  });

  it('shows the generated slots empty state', () => {
    const emptyState = fixture.nativeElement.querySelector(
      '[data-slots-empty]',
    );

    expect(emptyState.textContent).toContain(
      'No hay slots generados.',
    );
  });
});