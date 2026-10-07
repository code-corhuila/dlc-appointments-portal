import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';

import { SchedulingPageComponent } from './scheduling-page.component';

describe('SchedulingPageComponent', () => {
  let fixture: ComponentFixture<SchedulingPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchedulingPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(
      SchedulingPageComponent,
    );
    fixture.detectChanges();
  });

  it('renders the appointment scheduling structure', () => {
    const element =
      fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain(
      'Agendar Nueva Cita',
    );

    expect(element.textContent).toContain('1. Paciente');
    expect(element.textContent).toContain(
      '2. Fecha y horario',
    );
    expect(element.textContent).toContain('3. Odontólogo');
    expect(element.textContent).toContain('4. Motivo');
    expect(element.textContent).toContain('Resumen de Cita');
  });

  it('shows available slots and clinic timezone', () => {
    const element =
      fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain(
      'Horarios disponibles',
    );
    expect(element.textContent).toContain(
      'America/Bogota',
    );
  });

  it('allows an available slot to be selected', () => {
    const element =
      fixture.nativeElement as HTMLElement;

    const slots =
      element.querySelectorAll<HTMLButtonElement>(
        '[data-available-slot]',
      );

    expect(slots.length).toBeGreaterThan(0);

    const selectedSlot = slots[0];
    selectedSlot.click();
    fixture.detectChanges();

    expect(
      selectedSlot.getAttribute('aria-pressed'),
    ).toBe('true');

    expect(
      element.querySelector(
        '[data-selected-slot]',
      )?.textContent,
    ).toContain(selectedSlot.textContent?.trim());
  });

  it('provides the appointment confirmation action', () => {
    const element =
      fixture.nativeElement as HTMLElement;

    const confirmButton =
      element.querySelector<HTMLButtonElement>(
        '[data-confirm-appointment]',
      );

    expect(confirmButton).not.toBeNull();
    expect(confirmButton?.textContent).toContain(
      'Confirmar Cita',
    );
  });
});