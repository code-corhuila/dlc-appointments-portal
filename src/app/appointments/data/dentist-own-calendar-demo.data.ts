import { Appointment } from '../model/appointment';

export interface DentistOwnAppointmentDemo {
  readonly appointment: Appointment;
  readonly patientDisplayName: string;
}

export const DENTIST_OWN_CALENDAR_DEMO: readonly DentistOwnAppointmentDemo[] = [
  {
    appointment: {
      id: 'appointment-own-demo-001',
      patientId: 'patient-own-demo-001',
      dentistId: 'dentist-own-demo-001',
      startAt: '2026-10-15T09:00:00-05:00',
      endAt: '2026-10-15T09:30:00-05:00',
      status: 'PROGRAMADA',
      confirmationStatus: 'PENDING',
      version: 1,
    },
    patientDisplayName: 'Paciente demostrativo 1',
  },
  {
    appointment: {
      id: 'appointment-own-demo-002',
      patientId: 'patient-own-demo-002',
      dentistId: 'dentist-own-demo-001',
      startAt: '2026-10-16T11:00:00-05:00',
      endAt: '2026-10-16T11:30:00-05:00',
      status: 'FINALIZADA',
      confirmationStatus: 'CONFIRMED',
      version: 2,
    },
    patientDisplayName: 'Paciente demostrativo 2',
  },
  {
    appointment: {
      id: 'appointment-own-demo-003',
      patientId: 'patient-own-demo-003',
      dentistId: 'dentist-own-demo-002',
      startAt: '2026-10-15T10:00:00-05:00',
      endAt: '2026-10-15T10:30:00-05:00',
      status: 'PROGRAMADA',
      confirmationStatus: 'PENDING',
      version: 1,
    },
    patientDisplayName: 'Paciente demostrativo 3',
  },
  {
    appointment: {
      id: 'appointment-own-demo-004',
      patientId: 'patient-own-demo-004',
      dentistId: 'dentist-own-demo-002',
      startAt: '2026-10-17T14:00:00-05:00',
      endAt: '2026-10-17T14:30:00-05:00',
      status: 'FINALIZADA',
      confirmationStatus: 'CONFIRMED',
      version: 2,
    },
    patientDisplayName: 'Paciente demostrativo 4',
  },
];
