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