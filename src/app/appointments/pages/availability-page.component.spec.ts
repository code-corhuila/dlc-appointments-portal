import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';

import { AvailabilityPageComponent } from './availability-page.component';

describe('AvailabilityPageComponent', () => {
  let fixture: ComponentFixture<AvailabilityPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvailabilityPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(
      AvailabilityPageComponent,
    );
    fixture.detectChanges();
  });

  it('renders the availability configuration structure', () => {
    const element =
      fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain(
      'Horarios y Slots de Disponibilidad',
    );

    expect(
      element.querySelector('[data-dentist-select]'),
    ).not.toBeNull();

    expect(
      element.querySelector('[data-weekly-schedule]'),
    ).not.toBeNull();

    expect(
      element.querySelector('[data-slot-duration]'),
    ).not.toBeNull();
  });

  it('provides two work shifts for monday', () => {
    const element =
      fixture.nativeElement as HTMLElement;

    const monday =
      element.querySelector('[data-day="monday"]');

    expect(monday).not.toBeNull();

    expect(
      monday?.querySelector('[data-shift-one-start]'),
    ).not.toBeNull();

    expect(
      monday?.querySelector('[data-shift-one-end]'),
    ).not.toBeNull();

    expect(
      monday?.querySelector('[data-shift-two-start]'),
    ).not.toBeNull();

    expect(
      monday?.querySelector('[data-shift-two-end]'),
    ).not.toBeNull();
  });

  it('uses a 30 minute slot duration by default', () => {
    const element =
      fixture.nativeElement as HTMLElement;

    const duration =
      element.querySelector<HTMLSelectElement>(
        '[data-slot-duration]',
      );

    expect(duration?.value).toBe('30');
  });

  it('provides availability generation date range', () => {
    const element =
      fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector('[data-start-date]'),
    ).not.toBeNull();

    expect(
      element.querySelector('[data-end-date]'),
    ).not.toBeNull();

    expect(
      element.querySelector('[data-generate-slots]'),
    ).not.toBeNull();
  });

  it('shows clinic timezone', () => {
    const element =
      fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain(
      'America/Bogota',
    );
  });

  it('shows an empty state when no generated slots exist', () => {
    const element =
      fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector('[data-slots-empty]')?.textContent,
    ).toContain('No hay slots generados');
  });
});