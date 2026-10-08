import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AppointmentsApiService } from '../data/appointments-api.service';
import { DentistAvailability } from '../model/availability';
import { SchedulingPageComponent } from './scheduling-page.component';

describe('SchedulingPageComponent', () => {
  let fixture: ComponentFixture<SchedulingPageComponent>;
  let requestedDentistIds: string[];

  const availability: DentistAvailability = {
    id: 'availability-123',
    dentistId: 'dentist-123',
    intervals: [
      {
        startAt: '2026-10-05T14:00:00Z',
        endAt: '2026-10-05T15:00:00Z',
      },
    ],
    blockedIntervals: [],
    version: 1,
  };

  beforeEach(async () => {
    requestedDentistIds = [];

    await TestBed.configureTestingModule({
      imports: [SchedulingPageComponent],
      providers: [
        {
          provide: AppointmentsApiService,
          useValue: {
            getDentistAvailability: (dentistId: string) => {
              requestedDentistIds.push(dentistId);
              return of(availability);
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SchedulingPageComponent);
    fixture.detectChanges();
  });

  it('renders the scheduling structure aligned with the mockup', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent)
      .toContain('Agendar Nueva Cita');

    expect(element.textContent).toContain('Paciente');
    expect(element.textContent).toContain('Detalles de la Cita');
    expect(element.textContent).toContain('Especialista');
    expect(element.textContent).toContain('Motivo y Notas');
    expect(element.textContent).toContain('Resumen de Cita');

    expect(
      element.querySelector('[data-new-patient]'),
    ).not.toBeNull();

    expect(
      element.querySelector('#specialty'),
    ).not.toBeNull();

    expect(
      element.querySelector('#consultation-type'),
    ).not.toBeNull();

    expect(
      element.querySelector('#dentist'),
    ).not.toBeNull();
  });

  it('shows clinic timezone without invented slots initially', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Hora Sugerida');
    expect(element.textContent).toContain('America/Bogota');

    expect(
      element.querySelectorAll('[data-available-slot]').length,
    ).toBe(0);
  });

  it('loads dentist availability and renders slots for the selected date', () => {
    selectDentist('dentist-123');
    selectDate('2026-10-05');

    const element = fixture.nativeElement as HTMLElement;

    const slots = Array.from(
      element.querySelectorAll<HTMLButtonElement>(
        '[data-available-slot]',
      ),
    );

    expect(requestedDentistIds).toEqual(['dentist-123']);

    expect(
      slots.map((slot) => slot.textContent?.trim()),
    ).toEqual(['09:00', '09:30']);
  });

  it('allows a derived availability slot to be selected', () => {
    selectDentist('dentist-123');
    selectDate('2026-10-05');

    const element = fixture.nativeElement as HTMLElement;

    const slots = element.querySelectorAll<HTMLButtonElement>(
      '[data-available-slot]',
    );

    expect(slots.length).toBe(2);

    slots[0].click();
    fixture.detectChanges();

    expect(
      slots[0].getAttribute('aria-pressed'),
    ).toBe('true');

    expect(
      element.querySelector('[data-selected-slot]')?.textContent,
    ).toContain('09:00');
  });

  it('provides the appointment confirmation action', () => {
    const element = fixture.nativeElement as HTMLElement;

    const button = element.querySelector<HTMLButtonElement>(
      '[data-confirm-appointment]',
    );

    expect(button).not.toBeNull();
    expect(button?.textContent).toContain('Confirmar Cita');
  });

  function selectDentist(dentistId: string): void {
    const element = fixture.nativeElement as HTMLElement;

    const select =
      element.querySelector<HTMLSelectElement>('#dentist');

    expect(select).not.toBeNull();

    const option = document.createElement('option');
    option.value = dentistId;
    option.textContent = 'Dentist test';

    select?.append(option);

    if (select) {
      select.value = dentistId;
      select.dispatchEvent(new Event('change'));
    }

    fixture.detectChanges();
  }

  function selectDate(date: string): void {
    const element = fixture.nativeElement as HTMLElement;

    const input =
      element.querySelector<HTMLInputElement>(
        '#appointment-date',
      );

    expect(input).not.toBeNull();

    if (input) {
      input.value = date;
      input.dispatchEvent(new Event('change'));
    }

    fixture.detectChanges();
  }
});