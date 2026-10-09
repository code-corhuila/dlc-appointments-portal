import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { Appointment } from '../model/appointment';
import {
  ConfirmAppointmentRequest,
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
}
