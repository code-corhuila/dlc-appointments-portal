
import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
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
  const cancelAppointment = vi.fn();

  function createFixture(): ComponentFixture<AppointmentActionsComponent> {
    const fixture = TestBed.createComponent(
      AppointmentActionsComponent,
    );

    fixture.componentRef.setInput('appointment', appointment);
    fixture.componentRef.setInput('canManage', true);
    fixture.componentRef.setInput(
      'now',
      new Date('2026-10-09T14:00:00-05:00'),
    );
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

  function openCancellation(
    fixture: ComponentFixture<AppointmentActionsComponent>,
  ): HTMLElement {
    const element = fixture.nativeElement as HTMLElement;

    element.querySelector<HTMLButtonElement>(
      '[data-appointment-cancel]',
    )!.click();
    fixture.detectChanges();

    return element;
  }

  function submitCancellation(
    fixture: ComponentFixture<AppointmentActionsComponent>,
  ): HTMLElement {
    const element = openCancellation(fixture);
    const reason = element.querySelector<HTMLInputElement>(
      '[data-cancellation-reason]',
    )!;

    reason.value = 'Solicitud del paciente';
    reason.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    element.querySelector<HTMLButtonElement>(
      '[data-appointment-submit-cancellation]',
    )!.click();
    fixture.detectChanges();

    return element;
  }

  beforeEach(async () => {
    confirmAppointment.mockReset();
    cancelAppointment.mockReset();
    confirmAppointment.mockReturnValue(
      of({
        ...appointment,
        status: 'CONFIRMADA',
        confirmationStatus: 'CONFIRMED',
        version: 2,
      }),
    );
    cancelAppointment.mockReturnValue(
      of({ ...appointment, status: 'CANCELADA', version: 2 }),
    );

    await TestBed.configureTestingModule({
      imports: [AppointmentActionsComponent],
      providers: [{
        provide: AppointmentsApiService,
        useValue: { confirmAppointment, cancelAppointment },
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

  it('offers attention start for a confirmed appointment', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('appointment', {
      ...appointment,
      status: 'CONFIRMADA',
    });
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[data-appointment-start-attention]'))
      .not.toBeNull();
  });

  it('does not offer attention start for a scheduled appointment', () => {
    const element = createFixture().nativeElement as HTMLElement;
    expect(element.querySelector('[data-appointment-start-attention]'))
      .toBeNull();
  });

  it('submits the required reason and version when cancelling an eligible appointment', () => {
    const element = submitCancellation(createFixture());

    expect(cancelAppointment).toHaveBeenCalledWith(
      'appointment-001',
      { expectedVersion: 1, reason: 'Solicitud del paciente' },
      expect.any(String),
    );
    expect(element.querySelector('[role="status"]')?.textContent)
      .toContain('Cancelación registrada correctamente');
    expect(element.querySelector('[data-appointment-cancel]')).toBeNull();
  });

  it('leaves an appointment unchanged when dismissal cancels the cancellation form', () => {
    const fixture = createFixture();
    const element = openCancellation(fixture);

    element.querySelector<HTMLButtonElement>(
      '[data-appointment-dismiss-cancellation]',
    )!.click();
    fixture.detectChanges();

    expect(element.querySelector('[data-cancellation-reason]')).toBeNull();
    expect(element.querySelector('[data-appointment-cancel]')).not.toBeNull();
    expect(cancelAppointment).not.toHaveBeenCalled();
  });

  it('allows cancellation at exactly 24 hours and blocks it inside that window', () => {
    const fixture = createFixture();
    const element = fixture.nativeElement as HTMLElement;

    fixture.componentRef.setInput('appointment', {
      ...appointment,
      startAt: '2026-10-10T14:00:00-05:00',
    });
    fixture.detectChanges();

    expect(element.querySelector('[data-appointment-cancel]')).not.toBeNull();

    fixture.componentRef.setInput('appointment', {
      ...appointment,
      startAt: '2026-10-10T13:59:59-05:00',
    });
    fixture.detectChanges();

    expect(element.querySelector('[data-appointment-cancel]')).toBeNull();
    expect(element.querySelector('[data-cancellation-restriction]'))
      .not.toBeNull();
  });

  it('does not allow cancellation from a final appointment state', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('appointment', {
      ...appointment,
      status: 'FINALIZADA',
    });
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector(
      '[data-appointment-cancel]',
    )).toBeNull();
  });

  it('prevents duplicate cancellation submissions while a request is pending', () => {
    const response = new Subject<Appointment>();
    cancelAppointment.mockReturnValue(response);

    const element = submitCancellation(createFixture());
    const submit = element.querySelector<HTMLButtonElement>(
      '[data-appointment-submit-cancellation]',
    )!;

    expect(submit.disabled).toBe(true);
    submit.click();
    expect(cancelAppointment).toHaveBeenCalledOnce();

    response.complete();
  });

  it.each([403, 409])(
    'shows a clear error when cancellation returns %s',
    (status) => {
      cancelAppointment.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status })),
      );

      const element = submitCancellation(createFixture());

      expect(element.querySelector('[role="alert"]')).not.toBeNull();
    },
  );
});
