import { Injectable, signal } from '@angular/core';
import { Appointment, CreateAppointmentRequest } from '../model/appointment';

@Injectable({ providedIn: 'root' })
export class DemoAppointmentStore {
  readonly appointments = signal<readonly Appointment[]>([]);
  reserve(request: CreateAppointmentRequest, _patientName: string): Appointment {
    if (this.appointments().some((item) => item.dentistId === request.dentistId && item.startAt === request.startAt)) throw new Error('APPOINTMENT_CONFLICT');
    const appointment: Appointment = { id: `appointment-demo-created-${this.appointments().length + 1}`, ...request, status: 'PROGRAMADA', confirmationStatus: 'PENDING', version: 1 };
    this.appointments.update((items) => [...items, appointment]);
    return appointment;
  }
  forDentist(dentistId: string): readonly Appointment[] { return this.appointments().filter((item) => item.dentistId === dentistId); }
}
