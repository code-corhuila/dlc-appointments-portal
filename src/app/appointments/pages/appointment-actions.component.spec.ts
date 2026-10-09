
import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AppointmentsApiService } from '../data/appointments-api.service';
import { Appointment } from '../model/appointment';
import { AppointmentActionsComponent } from './appointment-actions.component';

describe('AppointmentActionsComponent', () => {
  const appointment: Appointment = {
    id: 'appointment-001',
    patientId: 'patient-001',
    dentistId: 'dentist-001',
    startAt: '2026-10-20T14:00:00Z',
    endAt: '2026-10-20T14:30:00Z',
    status: 'PROGRAMADA',
    confirmationStatus: 'PENDING',
    version: 1,
  };

  const confirmAppointment = vi.fn();

  function createFixture(): ComponentFixture<AppointmentActionsComponent> {
    const fixture = TestBed.createComponent(
      AppointmentActionsComponent,
    );

    fixture.componentRef.setInput('appointment', appointment);
    fixture.componentRef.setInput('canManage', true);
    fixture.detectChanges();

    return fixture;
  }

  function openConfirmation(
    fixture: ComponentFixture<AppointmentActionsComponent>,
  ): HTMLElement {
    const element = fixture.nativeElement as HTMLElement;

    element.querySelector<HTMLButtonElement>(
      '[data-appointment-confirm]',
    )!.click();

    fixture.detectChanges();
    return element;
  }

  function submitConfirmation(
    fixture: ComponentFixture<AppointmentActionsComponent>,
  ): HTMLElement {
    const element = openConfirmation(fixture);

    element.querySelector<HTMLButtonElement>(
      '[data-appointment-submit-confirmation]',
    )!.click();

    fixture.detectChanges();
    return element;
  }

  beforeEach(async () => {
    confirmAppointment.mockReset();
    confirmAppointment.mockReturnValue(
      of({
        ...appointment,
        status: 'CONFIRMADA',
        confirmationStatus: 'CONFIRMED',
        version: 2,
      }),
    );

    await TestBed.configureTestingModule({
      imports: [AppointmentActionsComponent],
      providers: [{
        provide: AppointmentsApiService,
        useValue: { confirmAppointment },
      }],
    }).compileComponents();
  });

  it('submits a staff confirmation using the approved API contract', () => {
    const fixture = createFixture();
    const element = openConfirmation(fixture);

    const channel = element.querySelector<HTMLSelectElement>(
      '[data-confirmation-channel]',
    );

    expect(channel).not.toBeNull();

    channel!.value = 'IN_PERSON';
    channel!.dispatchEvent(
      new Event('change', { bubbles: true }),
    );

    fixture.detectChanges();

    element.querySelector<HTMLButtonElement>(
      '[data-appointment-submit-confirmation]',
    )!.click();

    expect(confirmAppointment).toHaveBeenCalledOnce();
    expect(confirmAppointment).toHaveBeenCalledWith(
      'appointment-001',
      { expectedVersion: 1, channel: 'IN_PERSON' },
      expect.any(String),
    );

    expect(
      confirmAppointment.mock.calls[0][2].length,
    ).toBeGreaterThan(0);
  });

  it('hides confirmation actions after a successful confirmation', () => {
    const fixture = createFixture();
    const element = submitConfirmation(fixture);

    expect(confirmAppointment).toHaveBeenCalledOnce();
    expect(
      element.querySelector('[data-appointment-confirm]'),
    ).toBeNull();
    expect(
      element.querySelector('[data-appointment-submit-confirmation]'),
    ).toBeNull();
  });

  it('closes the confirmation form when selecting another appointment', () => {
    const fixture = createFixture();
    const element = openConfirmation(fixture);

    expect(
      element.querySelector('[data-confirmation-channel]'),
    ).not.toBeNull();

    fixture.componentRef.setInput('appointment', {
      ...appointment,
      id: 'appointment-002',
    });

    fixture.detectChanges();

    expect(
      element.querySelector('[data-confirmation-channel]'),
    ).toBeNull();
    expect(confirmAppointment).not.toHaveBeenCalled();
  });

  it('explains when staff lacks permission to confirm', () => {
    confirmAppointment.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 403 })),
    );

    const element = submitConfirmation(createFixture());

    expect(confirmAppointment).toHaveBeenCalledOnce();
    expect(element.querySelector('[role="alert"]')?.textContent)
      .toContain('permisos');
  });

  it('explains when the appointment version conflicts', () => {
    confirmAppointment.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 409 })),
    );

    const element = submitConfirmation(createFixture());

    expect(confirmAppointment).toHaveBeenCalledOnce();
    expect(element.querySelector('[role="alert"]')?.textContent)
      .toContain('cambió');
  });

  it('hides confirmation when staff cannot manage appointments', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('canManage', false);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[data-appointment-confirm]'))
      .toBeNull();
    expect(confirmAppointment).not.toHaveBeenCalled();
  });
});
