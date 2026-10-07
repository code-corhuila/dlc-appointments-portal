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
    expect(fixture.nativeElement.textContent).toContain(
      'Horarios y Slots de Disponibilidad',
    );
  });

  it('provides the main availability controls', () => {
    expect(
      fixture.nativeElement.querySelector('[data-dentist-select]'),
    ).not.toBeNull();

    expect(
      fixture.nativeElement.querySelector('[data-weekly-schedule]'),
    ).not.toBeNull();

    expect(
      fixture.nativeElement.querySelector('[data-generate-slots]'),
    ).not.toBeNull();
  });

  it('disables monday schedule fields when monday is disabled', () => {
    const monday = fixture.nativeElement.querySelector(
      '[data-day="monday"]',
    ) as HTMLElement;

    const enabled = monday.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement;

    const controls = Array.from(
      monday.querySelectorAll('input[type="time"], select'),
    ) as Array<HTMLInputElement | HTMLSelectElement>;

    expect(enabled.checked).toBe(true);
    expect(controls.every((control) => !control.disabled)).toBe(true);

    enabled.click();
    fixture.detectChanges();

    expect(enabled.checked).toBe(false);
    expect(controls.every((control) => control.disabled)).toBe(true);
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