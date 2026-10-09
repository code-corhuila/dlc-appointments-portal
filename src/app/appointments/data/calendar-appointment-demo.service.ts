import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { Appointment } from '../model/appointment';
import {
  CancelAppointmentRequest,
  ConfirmAppointmentRequest,
  RescheduleAppointmentRequest,
} from '../model/appointment-operations';

@Injectable()
export class CalendarAppointmentDemoService {
  confirmAppointment(
    id: string,
    request: ConfirmAppointmentRequest,
    _idempotencyKey: string,
  ): Observable<Appointment> {
    return of({
      id,
      patientId: 'patient-demo-001',
      dentistId: 'dentist-demo-001',
      startAt: '2026-10-15T14:00:00-05:00',
      endAt: '2026-10-15T14:30:00-05:00',
      reason: 'Control preventivo',
      status: 'CONFIRMADA',
      confirmationStatus: 'CONFIRMED',
      version: request.expectedVersion + 1,
    });
  }

  cancelAppointment(
    id: string,
    request: CancelAppointmentRequest,
    _idempotencyKey: string,
  ): Observable<Appointment> {
    return of({
      id,
      patientId: 'patient-demo-001',
      dentistId: 'dentist-demo-001',
      startAt: '2026-10-15T14:00:00-05:00',
      endAt: '2026-10-15T14:30:00-05:00',
      reason: request.reason,
      status: 'CANCELADA',
      confirmationStatus: 'PENDING',
      version: request.expectedVersion + 1,
    });
  }

  rescheduleAppointment(id: string, request: RescheduleAppointmentRequest, _idempotencyKey: string): Observable<Appointment> {
    return of({ id, patientId: 'patient-demo-001', dentistId: 'dentist-demo-001', startAt: request.startAt, endAt: request.endAt, reason: request.reason, status: 'PROGRAMADA', confirmationStatus: 'PENDING', version: request.expectedVersion + 1 });
  }

  startAttention(
    id: string,
    request: { readonly expectedVersion: number },
    _idempotencyKey: string,
  ): Observable<Appointment> {
    return of({
      id,
      patientId: 'patient-demo-001',
      dentistId: 'dentist-demo-001',
      startAt: '2026-10-15T14:00:00-05:00',
      endAt: '2026-10-15T14:30:00-05:00',
      reason: 'Control preventivo',
      status: 'EN_ATENCION',
      confirmationStatus: 'CONFIRMED',
      version: request.expectedVersion + 1,
    });
  }
}
